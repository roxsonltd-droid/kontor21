import { JsonRpcProvider } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { CONTRACT_ADDRESSES } from "@/lib/abis";
import { runEscrowIndexer } from "@/lib/chain-indexer";
import { reconcileEscrowState } from "@/lib/chain-reconciliation";
import { isAuthorizedInternalRequest } from "@/lib/internal-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ error: "Internal authorization required" }, { status: 401 });
  }
  const rpcUrl = process.env.ESCROW_RPC_URL || process.env.AMOY_RPC_URL;
  const contractAddress =
    process.env.KONTOR_ESCROW_ADDRESS || CONTRACT_ADDRESSES.kontorEscrow;
  if (!rpcUrl || !contractAddress) {
    return NextResponse.json({ error: "Chain synchronization is not configured" }, { status: 503 });
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const network = process.env.ESCROW_NETWORK || "polygon-amoy";
  const indexer = await runEscrowIndexer({
    provider,
    network,
    contractAddress,
    confirmations: Number(process.env.INDEXER_CONFIRMATIONS || 12),
    startBlock: Number(process.env.ESCROW_START_BLOCK || 0),
  });
  const reconciliation = await reconcileEscrowState({
    provider,
    network,
    contractAddress,
  });
  return NextResponse.json({ indexer, reconciliation });
}
