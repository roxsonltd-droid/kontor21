"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Wallet, CheckCircle2, Loader2 } from "lucide-react";

function NewTradeForm() {
  const searchParams = useSearchParams();
  const { createTrade } = { createTrade: async () => {} }; // imported from hook

  const [product, setProduct] = useState(searchParams.get("product") || "");
  const [quantity, setQuantity] = useState(searchParams.get("quantity") || "");
  const [price, setPrice] = useState(searchParams.get("price") || "");
  const [buyerWallet, setBuyerWallet] = useState(searchParams.get("buyer") || "");
  const [sellerWallet, setSellerWallet] = useState(searchParams.get("seller") || "");
  const [deliveryTerms, setDeliveryTerms] = useState(searchParams.get("terms") || "CIF");
  const [deliveryPort, setDeliveryPort] = useState(searchParams.get("port") || "");
  const [conditionDesc, setConditionDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ tradeId?: string; kontor21_url?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product,
          quantity: parseFloat(quantity),
          priceUsdc: parseFloat(price),
          buyerWallet,
          sellerWallet,
          unit: "tons",
          conditionDescription: conditionDesc || `${quantity}t ${product} ${deliveryTerms} ${deliveryPort}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to create escrow");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Escrow Draft Created</h1>
          <p className="text-zinc-400 mb-6">Trade ID: {result.tradeId}</p>
          <a
            href={result.kontor21_url}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-500 transition-colors"
          >
            Open Escrow <ArrowRight size={18} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Kontor 21</span>
        </Link>
      </nav>
      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">New Escrow</h1>
        <p className="text-zinc-500 mb-8">Pre-filled from TerraIQ intelligence</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Product</label>
              <input value={product} onChange={e => setProduct(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1" required />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Quantity (tons)</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Price (USDC/t)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1" required />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Delivery Terms</label>
              <select value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1">
                <option>CIF</option><option>FOB</option><option>DAP</option><option>EXW</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Delivery Port</label>
            <input value={deliveryPort} onChange={e => setDeliveryPort(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Buyer Wallet</label>
              <input value={buyerWallet} onChange={e => setBuyerWallet(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1 font-mono text-xs" required />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Seller Wallet</label>
              <input value={sellerWallet} onChange={e => setSellerWallet(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1 font-mono text-xs" required />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Condition Description</label>
            <textarea value={conditionDesc} onChange={e => setConditionDesc(e.target.value)} rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white mt-1" />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white rounded-xl py-4 font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
            {submitting ? "Creating..." : "Create Escrow Draft"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function NewTradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <NewTradeForm />
    </Suspense>
  );
}
