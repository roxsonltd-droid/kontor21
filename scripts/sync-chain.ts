import hre from "hardhat";
import { runEscrowIndexer } from "../lib/chain-indexer";
import { reconcileEscrowState } from "../lib/chain-reconciliation";
import { CONTRACT_ADDRESSES } from "../lib/abis";

async function main() {
  const contractAddress =
    process.env.KONTOR_ESCROW_ADDRESS || CONTRACT_ADDRESSES.kontorEscrow;
  const network = process.env.ESCROW_NETWORK || hre.network.name;
  const indexer = await runEscrowIndexer({
    provider: hre.ethers.provider,
    network,
    contractAddress,
    confirmations: Number(process.env.INDEXER_CONFIRMATIONS || 12),
    startBlock: Number(process.env.ESCROW_START_BLOCK || 0),
  });
  const reconciliation = await reconcileEscrowState({
    provider: hre.ethers.provider,
    network,
    contractAddress,
  });
  console.log(JSON.stringify({ indexer, reconciliation }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
