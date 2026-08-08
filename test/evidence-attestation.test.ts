import { expect } from "chai";
import { Wallet, getAddress } from "ethers";
import {
  evidenceDomainFor,
  recoverEvidenceAttestationSigner,
} from "../lib/evidence-attestation.ts";

const DOMAIN = evidenceDomainFor(80002, "0x0000000000000000000000000000000000000001");
const ATTESTATION_TYPES = {
  EvidenceAttestation: [
    { name: "documentHash", type: "string" },
    { name: "conditionId", type: "string" },
    { name: "verifiedValue", type: "string" },
    { name: "attestedAtMs", type: "uint256" },
  ],
} as const;

const MESSAGE = {
  documentHash: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  conditionId: "condition-1",
  verifiedValue: "8.0",
  attestedAtMs: 1239900000000,
};

describe("evidence attestation", function () {
  it("recovers the provider wallet from a typed-data signature", async function () {
    const wallet = Wallet.createRandom();
    const signature = await wallet.signTypedData(DOMAIN, ATTESTATION_TYPES, MESSAGE);
    const recovered = recoverEvidenceAttestationSigner(DOMAIN, MESSAGE, signature);
    expect(getAddress(recovered)).to.equal(getAddress(wallet.address));
  });

  it("rejects a signature bound to a different verifying contract", async function () {
    const wallet = Wallet.createRandom();
    const signature = await wallet.signTypedData(DOMAIN, ATTESTATION_TYPES, MESSAGE);
    const otherDomain = evidenceDomainFor(80002, "0x0000000000000000000000000000000000000002");
    const recovered = recoverEvidenceAttestationSigner(otherDomain, MESSAGE, signature);
    expect(getAddress(recovered)).not.to.equal(getAddress(wallet.address));
  });

  it("binds the signature to the document hash", async function () {
    const wallet = Wallet.createRandom();
    const signature = await wallet.signTypedData(DOMAIN, ATTESTATION_TYPES, MESSAGE);
    const tampered = recoverEvidenceAttestationSigner(
      DOMAIN,
      { ...MESSAGE, documentHash: "bafyreiqvftnvk7ekfj32mkvgvbiq4p6n7v5d5znqmx7cqzqnp3oyr2k" },
      signature
    );
    expect(getAddress(tampered)).not.to.equal(getAddress(wallet.address));
  });
});