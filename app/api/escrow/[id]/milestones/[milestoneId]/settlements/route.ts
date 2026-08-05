import { parseUnits } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { milestoneHashFor, verifyOnchainPendingRelease } from "@/lib/onchain-escrow";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const actorWallet = await authenticateWalletRequest(req, "");
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }
  const { id, milestoneId } = await context.params;
  const milestone = await prisma.tradeMilestone.findFirst({
    where: { id: milestoneId, tradeId: id },
    include: { trade: { include: { buyer: true, seller: true, oracle: true } } },
  });
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }
  const actor = actorWallet.toLowerCase();
  const canRead =
    milestone.trade.buyer.walletAddress.toLowerCase() === actor ||
    milestone.trade.seller.walletAddress.toLowerCase() === actor ||
    milestone.trade.oracle?.walletAddress.toLowerCase() === actor;
  if (!canRead) {
    return NextResponse.json({ error: "Trade participant access required" }, { status: 403 });
  }
  const settlements = await prisma.milestoneSettlement.findMany({
    where: { milestoneId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(settlements);
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const { id, milestoneId } = await context.params;
    const milestone = await prisma.tradeMilestone.findFirst({
      where: { id: milestoneId, tradeId: id },
      include: {
        trade: { include: { oracle: true } },
        settlements: { where: { status: { in: ["PROPOSED", "APPROVED", "EXECUTED"] } } },
      },
    });
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    if (milestone.trade.oracle?.walletAddress.toLowerCase() !== actorWallet.toLowerCase()) {
      return NextResponse.json({ error: "Designated oracle required" }, { status: 403 });
    }
    if (!milestone.trade.blockchainTradeId) {
      return NextResponse.json({ error: "Trade is not linked on-chain" }, { status: 409 });
    }

    const body = JSON.parse(rawBody) as { amountUsdc?: string | number; evidenceRoot?: string };
    const amount = String(body.amountUsdc ?? "");
    const amountWei = parseUnits(amount, 6);
    const evidenceRoot = body.evidenceRoot || "";
    if (amountWei <= BigInt(0) || !/^0x[0-9a-fA-F]{64}$/.test(evidenceRoot)) {
      return NextResponse.json({ error: "Positive amount and bytes32 evidence root required" }, { status: 400 });
    }
    const alreadyAllocated = milestone.settlements.reduce(
      (sum, settlement) => sum + parseUnits(settlement.amountUsdc.toString(), 6),
      BigInt(0)
    );
    if (alreadyAllocated + amountWei > parseUnits(milestone.amountUsdc.toString(), 6)) {
      return NextResponse.json({ error: "Settlement exceeds milestone amount" }, { status: 409 });
    }
    const matchesChain = await verifyOnchainPendingRelease(
      milestone.trade.blockchainTradeId,
      milestoneHashFor(milestoneId),
      amountWei,
      evidenceRoot
    );
    if (matchesChain == null) {
      return NextResponse.json({ error: "Proposal does not match on-chain pending release" }, { status: 409 });
    }

    const settlement = await prisma.milestoneSettlement.create({
      data: {
        milestoneId,
        amountUsdc: amount,
        evidenceRoot: evidenceRoot.toLowerCase(),
        proposalId: matchesChain,
        milestoneHash: milestoneHashFor(milestoneId).toLowerCase(),
        status: "PROPOSED",
      },
    });
    await prisma.tradeMilestone.update({
      where: { id: milestoneId },
      data: { status: "READY_FOR_RELEASE" },
    });
    await prisma.auditLog.create({
      data: { tradeId: id, action: "MILESTONE_RELEASE_PROPOSED", actorWallet },
    });
    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("[milestone-settlement-propose]", error);
    return NextResponse.json({ error: "Unable to record milestone settlement proposal" }, { status: 500 });
  }
}
