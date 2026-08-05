import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const actorWallet = await authenticateWalletRequest(req, "");
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const notifications = await prisma.notification.findMany({
      where: { user: { walletAddress: actorWallet }, channel: "IN_APP" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, event: true, title: true, body: true, readAt: true, createdAt: true },
    });
    return NextResponse.json(notifications);
  } catch (err) {
    console.error("[notifications-list]", err);
    return NextResponse.json({ error: "Failed to list notifications" }, { status: 500 });
  }
}

// Generic autosigned body reader used by Next route handlers.
export async function PATCH(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { walletAddress: actorWallet },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    let ids: string[] | undefined;
    try {
      const parsed = JSON.parse(rawBody || "{}") as { ids?: string[] };
      ids = Array.isArray(parsed.ids) ? parsed.ids : undefined;
    } catch {
      ids = undefined;
    }
    await prisma.notification.updateMany({
      where: ids?.length ? { userId: user.id, id: { in: ids } } : { userId: user.id },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications-mark-read]", err);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}