import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest, isConfiguredArbitrator } from "@/lib/api-auth";

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

    const { documentHash, providerWallet, verifiedValue, conditionId } = body;
    if (!documentHash || !providerWallet) {
      return NextResponse.json({ error: "Missing documentHash or providerWallet" }, { status: 400 });
    }
    if (providerWallet.toLowerCase() !== actorWallet.toLowerCase()) {
      return NextResponse.json({ error: "Provider wallet must sign the request" }, { status: 403 });
    }

    const trade = await prisma.tradeMetadata.findUnique({
      where: { id },
      include: { conditions: true, evidence: true, oracle: true }
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    const provider = await prisma.user.findUnique({ where: { walletAddress: actorWallet } });
    if (!provider || !["LAB", "INSPECTOR", "ORACLE"].includes(provider.role)) {
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
      provider.role === "ORACLE" &&
      trade.oracle?.walletAddress.toLowerCase() === actorWallet.toLowerCase();
    const hasRequiredProviderRole =
      provider.role !== "ORACLE" && targetCondition?.providerRole === provider.role;
    if (!targetCondition || (!isDesignatedOracle && !hasRequiredProviderRole)) {
      return NextResponse.json({ error: "Provider is not authorized for this condition" }, { status: 403 });
    }

    // Basic Rules Engine Evaluation
    if (targetCondition && verifiedValue) {
      const numValue = parseFloat(verifiedValue);
      const conditionNum = parseFloat(targetCondition.value);
      
      if (!isNaN(numValue) && !isNaN(conditionNum)) {
        switch (targetCondition.operator) {
          case "LTE": isValid = numValue <= conditionNum; break;
          case "GTE": isValid = numValue >= conditionNum; break;
          case "LT": isValid = numValue < conditionNum; break;
          case "GT": isValid = numValue > conditionNum; break;
          case "EQ": isValid = numValue === conditionNum; break;
          default: isValid = verifiedValue === targetCondition.value;
        }
      } else {
        isValid = verifiedValue.toLowerCase() === targetCondition.value.toLowerCase();
      }
    }

    // Save Evidence
    const evidence = await prisma.evidence.create({
      data: {
        tradeId: id,
        conditionId: targetCondition?.id || null,
        documentHash,
        providerWallet: actorWallet,
        verifiedValue: verifiedValue || null,
        validationStatus: isValid === true ? "VALID" : isValid === false ? "INVALID" : "PENDING"
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

    return NextResponse.json({ success: true, evidence, conditionsMet: metConditions.length, required: requiredConditions.length });

  } catch (error) {
    console.error("[evidence-upload]", error);
    return NextResponse.json({ error: "Failed to upload evidence" }, { status: 500 });
  }
}
