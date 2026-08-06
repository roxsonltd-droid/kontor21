import { Contract, JsonRpcProvider, getAddress, keccak256, toUtf8Bytes } from "ethers";
import { CONTRACT_ADDRESSES } from "@/lib/abis";

const TRADE_ABI = [
  "function trades(uint256) view returns (address buyer,address seller,address oracle,uint256 totalAmount,uint256 releasedAmount,address token,uint8 status,uint8 votesForBuyer,uint8 votesForSeller)",
  "function pendingProposalOf(uint256) view returns (uint256)",
  "function proposals(uint256) view returns (uint256 proposalId,uint256 tradeId,bytes32 milestoneHash,uint256 amount,bytes32 evidenceRoot,address proposedBy,uint64 createdAt,uint8 status)",
] as const;

type ExpectedParticipants = {
  buyer: string;
  seller: string;
  oracle?: string | null;
};

function escrowContract() {
  const rpcUrl = process.env.ESCROW_RPC_URL || process.env.AMOY_RPC_URL;
  const contractAddress =
    process.env.KONTOR_ESCROW_ADDRESS || CONTRACT_ADDRESSES.kontorEscrow;
  if (!rpcUrl || !contractAddress) {
    throw new Error("On-chain verification is not configured");
  }
  return new Contract(contractAddress, TRADE_ABI, new JsonRpcProvider(rpcUrl));
}

export function milestoneHashFor(milestoneId: string): string {
  return keccak256(toUtf8Bytes(`milestone:${milestoneId}`));
}

export async function verifyOnchainTradeParticipants(
  tradeId: number,
  expected: ExpectedParticipants
) {
  const trade = await escrowContract().trades(tradeId);
  return (
    getAddress(trade.buyer) === getAddress(expected.buyer) &&
    getAddress(trade.seller) === getAddress(expected.seller) &&
    (!expected.oracle || getAddress(trade.oracle) === getAddress(expected.oracle))
  );
}

export async function verifyOnchainTradeStatus(tradeId: number, expectedStatus: number) {
  const trade = await escrowContract().trades(tradeId);
  return Number(trade.status) === expectedStatus;
}

export type PendingRelease = {
  proposalId: bigint;
  milestoneHash: string;
  amount: bigint;
  evidenceRoot: string;
};

/**
 * Reads the current pending release proposal for a trade from the V4 contract.
 * Returns null when no pending proposal exists.
 */
export async function getOnchainPendingRelease(
  tradeId: number
): Promise<PendingRelease | null> {
  const contract = escrowContract();
  const proposalId = BigInt(await contract.pendingProposalOf(tradeId));
  if (proposalId <= BigInt(0)) return null;
  const proposal = await contract.proposals(proposalId);
  return {
    proposalId,
    milestoneHash: proposal.milestoneHash,
    amount: proposal.amount,
    evidenceRoot: proposal.evidenceRoot,
  };
}

export async function verifyOnchainPendingRelease(
  tradeId: number,
  milestoneHash: string,
  amount: bigint,
  evidenceRoot: string
): Promise<bigint | null> {
  const pending = await getOnchainPendingRelease(tradeId);
  if (!pending) return null;
  const matches =
    pending.milestoneHash.toLowerCase() === milestoneHash.toLowerCase() &&
    pending.amount === amount &&
    pending.evidenceRoot.toLowerCase() === evidenceRoot.toLowerCase();
  return matches ? pending.proposalId : null;
}
