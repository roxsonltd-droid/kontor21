import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateWalletRequest } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const claimedSha256 = req.headers.get("x-content-sha256") || "";
  const actorWallet = await authenticateWalletRequest(
    req,
    claimedSha256 ? `sha256:${claimedSha256}` : ""
  );
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }

  const provider = await prisma.user.findUnique({ where: { walletAddress: actorWallet } });
  if (!provider || !["LAB", "INSPECTOR", "ORACLE"].includes(provider.role)) {
    return NextResponse.json({ error: "Approved evidence provider required" }, { status: 403 });
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    return NextResponse.json({ error: "IPFS provider is not configured" }, { status: 503 });
  }

  const incoming = await req.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be between 1 byte and 10 MB" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPEG, PNG, and WebP files are supported" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (!claimedSha256 || claimedSha256 !== sha256) {
    return NextResponse.json({ error: "Signed file hash does not match upload" }, { status: 400 });
  }
  const pinataForm = new FormData();
  pinataForm.append("file", new File([bytes], file.name, { type: file.type }));
  pinataForm.append("pinataMetadata", JSON.stringify({
    name: file.name,
    keyvalues: { uploadedBy: actorWallet, sha256 },
  }));
  pinataForm.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body: pinataForm,
  });
  const result = await response.json() as { IpfsHash?: string; error?: string };
  if (!response.ok || !result.IpfsHash) {
    console.error("[ipfs-upload]", response.status, result.error || "Pinata upload failed");
    return NextResponse.json({ error: "Failed to upload document to IPFS" }, { status: 502 });
  }

  return NextResponse.json({
    cid: result.IpfsHash,
    sha256,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
