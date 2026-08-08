import { verifyTypedData } from "ethers";

// Nexus Core: Off-chain EIP-712 evidence attestation.
// An evidence provider signs its claim over the document hash, condition, value,
// and timestamp. The server recovers and verifies the signer against registered
// provider wallets. Pure and unit-testable without a DB.

export const EIP712_DOMAIN_NAME = "Kontor21 Evidence";
export const EIP712_DOMAIN_VERSION = "1";
export const EIP712_PRIMARY_TYPE = "EvidenceAttestation";

export type EvidenceDomain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
};

// The message that a provider signs. attestedAtMs is the signing time in ms so
// the recovery is deterministic and replayable during verification.
export type EvidenceAttestationMessage = {
  documentHash: string; // IPFS CID of the uploaded document
  conditionId: string | null;
  verifiedValue: string | null;
  attestedAtMs: number | null;
};

const MESSAGE_TYPE = [
  { name: "documentHash", type: "string" },
  { name: "conditionId", type: "string" },
  { name: "verifiedValue", type: "string" },
  { name: "attestedAtMs", type: "uint256" },
];

// Convenience: the domain fields needed for the typed-data signature, derived
// from the same server configuration used by on-chain verification.
export function evidenceDomainFor(chainId: number, verifyingContract: string): EvidenceDomain {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId,
    verifyingContract,
  };
}

// Full typed-data envelope, useful for debugging and for clients that build the
// hash themselves.
export function evidenceAttestationTypedData(domain: EvidenceDomain, message: EvidenceAttestationMessage) {
  return {
    domain,
    types: { [EIP712_PRIMARY_TYPE]: MESSAGE_TYPE },
    primaryType: EIP712_PRIMARY_TYPE,
    message,
  };
}

/**
 * Recovers the signer address of an evidence attestation signature. Throws if
 * the signature or message is malformed. Callers check the recovered address
 * against trusted provider wallets before accepting the evidence.
 */
export function recoverEvidenceAttestationSigner(
  domain: EvidenceDomain,
  message: EvidenceAttestationMessage,
  signature: string
): string {
  return verifyTypedData(domain, { [EIP712_PRIMARY_TYPE]: MESSAGE_TYPE }, message, signature);
}