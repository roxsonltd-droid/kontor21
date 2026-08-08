import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest, isConfiguredArbitrator } from "@/lib/api-auth";
import { findActiveEvidenceProvider } from "@/lib/evidence-provider-db";
import { extractFieldValue, extractionMetaFor, type ExtractionMeta } from "@/lib/document-extraction";
import { evaluateCondition } from "@/lib/rules-engine";
import { getAddress } from "ethers";
import { evidenceDomainFor, recoverEvidenceAttestationSigner } from "@/lib/evidence-attestation";
import { CONTRACT_ADDRESSES } from "@/lib/abis";
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const actorWallet = await authenticateWalletRequest(req, "");
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }
  const trade = await prisma.tradeMetadata.findUnique({
    where: { id },
    include: { buyer: true, seller: true, oracle: true },
  });
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }
  const actor = actorWallet.toLowerCase();
  const canRead =
    trade.buyer.walletAddress.toLowerCase() === actor ||
    trade.seller.walletAddress.toLowerCase() === actor ||
    trade.oracle?.walletAddress.toLowerCase() === actor ||
    isConfiguredArbitrator(actorWallet);
  if (!canRead) {
    return NextResponse.json({ error: "Wallet is not authorized to read this evidence" }, { status: 403 });
  }
  const evidence = await prisma.evidence.findMany({
    where: { tradeId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ evidence });
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const body = JSON.parse(rawBody);

    const { documentHash, providerWallet, verifiedValue, conditionId, milestoneId, documentText, providerSignature, attestedAtMs } = body;
    if (!documentHash || !providerWallet) {
      return NextResponse.json({ error: "Missing documentHash or providerWallet" }, { status: 400 });
    }
    if (providerWallet.toLowerCase() !== actorWallet.toLowerCase()) {
      return NextResponse.json({ error: "Provider wallet must sign the request" }, { status: 403 });
    }

    // Off-chain EIP-712 evidence attestation: when a provider supplies a typed
    // signature, recover the signer from it and bind it to the request wallet.
    // A mismatch rejects the submission before any rows are written.
    let attestationData: { attestationSignature?: string; attestedAt?: Date } = {};
    if (providerSignature) {
      if (typeof providerSignature !== "string" || attestedAtMs == null) {
        return NextResponse.json({ error: "providerSignature and attestedAtMs are required together" }, { status: 400 });
      }
      const attestedDate = new Date(Number(attestedAtMs));
      if (Number.isNaN(attestedDate.getTime()) || Math.abs(Date.now() - attestedDate.getTime()) > 5 * 60 * 1000) {
        return NextResponse.json({ error: "Attestation timestamp is invalid or too old" }, { status: 400 });
      }
      const chainId = Number(process.env.API_CHAIN_ID || 80002);
      const verifyingContract =
        (process.env.KONTOR_ESCROW_ADDRESS || CONTRACT_ADDRESSES.kontorEscrow)?.toLowerCase();
      if (!verifyingContract) {
        return NextResponse.json({ error: "On-chain configuration is not set" }, { status: 503 });
      }
      let signerAddress: string;
      try {
        signerAddress = recoverEvidenceAttestationSigner(
          evidenceDomainFor(chainId, verifyingContract),
          {
            documentHash: documentHash.toLowerCase(),
            conditionId: conditionId || null,
            verifiedValue: verifiedValue || null,
            attestedAtMs: Number(attestedAtMs),
          },
          providerSignature
        );
      } catch {
        return NextResponse.json({ error: "Attestation signature is invalid" }, { status: 400 });
      }
      if (getAddress(signerAddress) !== getAddress(actorWallet)) {
        return NextResponse.json({ error: "Attestation signer does not match the request wallet" }, { status: 403 });
      }
      attestationData = { attestationSignature: providerSignature, attestedAt: attestedDate };
    }

    const trade = await prisma.tradeMetadata.findUnique({
      where: { id },
      include: { conditions: true, evidence: true, oracle: true }
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    const provider = await prisma.user.findUnique({ where: { walletAddress: actorWallet } });
    const registeredProvider = await findActiveEvidenceProvider(actorWallet);
    const approvedRole =
      provider && ["LAB", "INSPECTOR", "ORACLE"].includes(provider.role);
    if (!registeredProvider && !approvedRole) {
      return NextResponse.json({ error: "Wallet is not an approved evidence provider" }, { status: 403 });
    }

    let targetCondition = null;
    let isValid = null;

    if (conditionId) {
      targetCondition = trade.conditions.find(c => c.id === conditionId);
    } else {
      // Auto-match if we can (naive first match for the provider)
      targetCondition = trade.conditions.find(c => c.providerRole === "LAB" || c.providerRole === "INSPECTOR");
    }
    const isDesignatedOracle =
      (registeredProvider?.providerRole === "ORACLE" || provider?.role === "ORACLE") &&
      trade.oracle?.walletAddress.toLowerCase() === actorWallet.toLowerCase();
    const providerRole = registeredProvider?.providerRole || provider?.role || null;
    const hasRequiredProviderRole =
      providerRole && providerRole !== "ORACLE" && targetCondition?.providerRole === providerRole;
    if (!targetCondition || (!isDesignatedOracle && !hasRequiredProviderRole)) {
      return NextResponse.json({ error: "Provider is not authorized for this condition" }, { status: 403 });
    }
    const resolvedMilestoneId = milestoneId || targetCondition.milestoneId || null;
    if (resolvedMilestoneId) {
      const milestone = await prisma.tradeMilestone.findFirst({
        where: { id: resolvedMilestoneId, tradeId: id },
        select: { id: true },
      });
      if (!milestone || (targetCondition.milestoneId && targetCondition.milestoneId !== resolvedMilestoneId)) {
        return NextResponse.json({ error: "Evidence milestone does not match the condition" }, { status: 400 });
      }
    }

    // OCR/document-text extraction: when the provider did not hand-type a
    // verified value but supplied documentText (OCR output or metadata dump),
    // parse the parameter for the target condition and auto-fill the value.
    let resolvedVerifiedValue = verifiedValue as string | undefined;
    let extractionMeta: ExtractionMeta | null = null;
    if (targetCondition && !resolvedVerifiedValue && documentText) {
      const extracted = extractFieldValue(String(documentText), targetCondition.parameter);
      if (extracted) {
        resolvedVerifiedValue = extracted.value;
        extractionMeta = extractionMetaFor(
          targetCondition.parameter,
          resolvedVerifiedValue,
          `${targetCondition.parameter}: ${extracted.value}${extracted.unit ? ` ${extracted.unit}` : ""}`,
        );
      }
    }

    // Rules Engine Evaluation
    if (targetCondition && resolvedVerifiedValue) {
      isValid = evaluateCondition(resolvedVerifiedValue, targetCondition.value, targetCondition.operator);
    }

    // Save Evidence
    const evidence = await prisma.evidence.create({
      data: {
        tradeId: id,
        conditionId: targetCondition?.id || null,
        documentHash,
        providerWallet: actorWallet,
        providerId: registeredProvider?.id || null,
        verifiedValue: resolvedVerifiedValue || null,
        ...(extractionMeta ? { extractionMeta: extractionMeta as unknown as object } : {}),
        ...attestationData,
        validationStatus: isValid === true ? "VALID" : isValid === false ? "INVALID" : "PENDING",
        milestoneId: resolvedMilestoneId,
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tradeId: id,
        action: isValid ? "VALID_EVIDENCE_UPLOADED" : "EVIDENCE_UPLOADED",
        actorWallet,
        documentIpfsHash: documentHash
      }
    });

    // Re-evaluate overall trade status
    const allEvidence = await prisma.evidence.findMany({ where: { tradeId: id } });
    
    // Check if all required conditions are met
    const requiredConditions = trade.conditions.filter(c => c.isRequired);
    const metConditions = requiredConditions.filter(c => {
      // Find valid evidence for this condition
      return allEvidence.some(e => e.conditionId === c.id && e.validationStatus === "VALID");
    });

    if (requiredConditions.length > 0 && metConditions.length === requiredConditions.length) {
      await prisma.tradeMetadata.update({
        where: { id },
        data: { operationalStatus: "CONDITIONS_SATISFIED" }
      });
      
      await prisma.auditLog.create({
        data: {
          tradeId: id,
          action: "CONDITIONS_SATISFIED",
          actorWallet: "SYSTEM"
        }
      });
    }

    // Check if milestone conditions are met
    if (resolvedMilestoneId) {
      const milestoneConditions = trade.conditions.filter(c => c.milestoneId === resolvedMilestoneId && c.isRequired);
      const metMilestoneConditions = milestoneConditions.filter(c => {
        return allEvidence.some(e => e.conditionId === c.id && e.validationStatus === "VALID");
      });
      
      if (milestoneConditions.length > 0 && metMilestoneConditions.length === milestoneConditions.length) {
        await prisma.tradeMilestone.update({
          where: { id: resolvedMilestoneId },
          data: { status: "READY_FOR_RELEASE" }
        });
      }
    }

    return NextResponse.json({ success: true, evidence, conditionsMet: metConditions.length, required: requiredConditions.length });

  } catch (error) {
    console.error("[evidence-upload]", error);
    return NextResponse.json({ error: "Failed to upload evidence" }, { status: 500 });
  }
}
