import * as fs from "fs";
import * as path from "path";

const escrowArtifact = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "artifacts/contracts/KontorEscrow.sol/KontorEscrow.json"),
    "utf8"
  )
);
const usdcArtifact = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "artifacts/contracts/TestUSDC.sol/TestUSDC.json"),
    "utf8"
  )
);

function formatAbi(abi) {
  return abi.map((entry) => JSON.stringify(entry)).join(",\n  ");
}

const file = `import addressesJson from "./contract-addresses.json";

export const CONTRACT_ADDRESSES = addressesJson as {
  testUSDC: string;
  kontorEscrow: string;
  arbitrator1?: string;
  arbitrator2?: string;
  arbitrator3?: string;
  arbitrator?: string;
};

export const KONTOR_ESCROW_ABI = [
  ${formatAbi(escrowArtifact.abi)}
] as const;

export const TEST_USDC_ABI = [
  ${formatAbi(usdcArtifact.abi)}
] as const;
`;

fs.writeFileSync(path.join(process.cwd(), "lib/abis.ts"), file);
console.log("Regenerated lib/abis.ts");
