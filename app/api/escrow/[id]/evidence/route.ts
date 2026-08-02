import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { documentHash, providerWallet, verifiedValue, conditionId } = body;
    if (!documentHash || !providerWallet) {
      return NextResponse.json({ error: "Missing documentHash or providerWallet" }, { status: 400 });
    }

    const trade = await prisma.tradeMetadata.findUnique({
      where: { id },
      include: { conditions: true, evidence: true }
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    let targetCondition = null;
    let isValid = null;

    if (conditionId) {
      targetCondition = trade.conditions.find(c => c.id === conditionId);
    } else {
      // Auto-match if we can (naive first match for the provider)
      targetCondition = trade.conditions.find(c => c.providerRole === "LAB" || c.providerRole === "INSPECTOR");
    }

    // Basic Rules Engine Evaluation
    if (targetCondition && verifiedValue) {
      const numValue = parseFloat(verifiedValue);
      const conditionNum = parseFloat(targetCondition.value);
      
      if (!isNaN(numValue) && !isNaN(conditionNum)) {
        switch (targetCondition.operator) {
          case "<=": isValid = numValue <= conditionNum; break;
          case ">=": isValid = numValue >= conditionNum; break;
          case "<": isValid = numValue < conditionNum; break;
          case ">": isValid = numValue > conditionNum; break;
          case "==": isValid = numValue === conditionNum; break;
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
        providerWallet,
        verifiedValue: verifiedValue || null,
        isValid
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tradeId: id,
        action: isValid ? "VALID_EVIDENCE_UPLOADED" : "EVIDENCE_UPLOADED",
        actorWallet: providerWallet,
        documentIpfsHash: documentHash
      }
    });

    // Re-evaluate overall trade status
    const allEvidence = await prisma.evidence.findMany({ where: { tradeId: id } });
    
    // Check if all required conditions are met
    const requiredConditions = trade.conditions.filter(c => c.isRequired);
    const metConditions = requiredConditions.filter(c => {
      // Find valid evidence for this condition
      return allEvidence.some(e => e.conditionId === c.id && e.isValid === true);
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
