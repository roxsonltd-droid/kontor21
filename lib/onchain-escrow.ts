import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESSES } from "@/lib/abis";

const TRADE_ABI = [
  "function trades(uint256) view returns (address buyer,address seller,address oracle,uint256 totalAmount,uint256 releasedAmount,address token,uint8 status,uint8 votesForBuyer,uint8 votesForSeller)",
  "function pendingReleaseAmounts(uint256) view returns (uint256)",
  "function pendingEvidenceRoots(uint256) view returns (bytes32)",
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

export async function verifyOnchainPendingRelease(
  tradeId: number,
  amount: bigint,
  evidenceRoot: string
) {
  const contract = escrowContract();
  const [pendingAmount, pendingRoot] = await Promise.all([
    contract.pendingReleaseAmounts(tradeId),
    contract.pendingEvidenceRoots(tradeId),
  ]);
  return pendingAmount === amount && pendingRoot.toLowerCase() === evidenceRoot.toLowerCase();
}
