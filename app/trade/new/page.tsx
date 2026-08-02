"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, ArrowLeft, Wallet, CheckCircle2, Loader2, Blocks, Navigation, Factory, FileText, Anchor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function NewTradeWizard() {
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  
  // Step State
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ tradeId?: string; kontor21_url?: string } | null>(null);

  // Form State
  const [product, setProduct] = useState(searchParams.get("product") || "High-Oleic Sunflower Seeds");
  const [quantity, setQuantity] = useState(searchParams.get("quantity") || "50");
  const [price, setPrice] = useState(searchParams.get("price") || "820");
  const [buyerWallet, setBuyerWallet] = useState(searchParams.get("buyer") || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
  const [sellerWallet, setSellerWallet] = useState(searchParams.get("seller") || "0x9D4...1F2");
  const [deliveryTerms, setDeliveryTerms] = useState(searchParams.get("terms") || "FOB");
  const [deliveryPort, setDeliveryPort] = useState(searchParams.get("port") || "Varna");
  const [oracle, setOracle] = useState("sgs");
  
  const totalValue = parseFloat(quantity) * parseFloat(price) || 0;

  // Local translations for the wizard
  const wt = {
    step1: { EN: "1. Trade Details", DE: "1. Handelsdetails", BG: "1. Детайли на сделката" },
    step2: { EN: "2. Verification & Oracle", DE: "2. Verifizierung & Orakel", BG: "2. Оракул и Документи" },
    step3: { EN: "3. Blockchain Deploy", DE: "3. Blockchain Bereitstellung", BG: "3. Смарт Договор" },
    next: { EN: "Next Step", DE: "Nächster Schritt", BG: "Следваща стъпка" },
    back: { EN: "Back", DE: "Zurück", BG: "Назад" },
    deploy: { EN: "Deploy Escrow Contract", DE: "Escrow-Vertrag bereitstellen", BG: "Генерирай Смарт Договор" },
    deploying: { EN: "Deploying to Polygon...", DE: "Bereitstellung auf Polygon...", BG: "Записване в Polygon мрежата..." }
  };

  const getTranslation = (key: keyof typeof wt) => wt[key][language] || wt[key].EN;

  const handleDeploy = async () => {
    setSubmitting(true);
    // Simulate Blockchain transaction delay for presentation Wow-factor
    setTimeout(async () => {
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
            conditionDescription: `${quantity}t ${product} ${deliveryTerms} ${deliveryPort} | Oracle: ${oracle.toUpperCase()}`,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data);
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        alert("Failed to deploy escrow");
      } finally {
        setSubmitting(false);
      }
    }, 2500); // 2.5s delay for effect
  };

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl p-10 text-center backdrop-blur-xl shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-3">Smart Contract Deployed!</h1>
          <p className="text-zinc-400 mb-8 text-lg">
            {language === 'BG' ? 'Сделката е защитена математически на блокчейна.' : 'Your trade is now mathematically secured on the blockchain.'}
          </p>
          <div className="bg-black/30 rounded-xl p-4 mb-8 font-mono text-sm text-zinc-300 border border-zinc-800/50">
            Contract Address: <br/>
            <span className="text-emerald-400">0x{(Math.random()*1e16).toString(16)}...</span>
          </div>
          <a
            href={result.kontor21_url || `/trade/${result.tradeId}`}
            className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(5,150,105,0.4)]"
          >
            {language === 'BG' ? 'Към Сделката' : 'View Escrow Dashboard'} <ArrowRight size={20} />
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-emerald-500/30">
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md px-6 h-20 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
            <Blocks className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Kontor 21</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          Escrow Wizard
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                {s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {getTranslation(`step${s}` as keyof typeof wt)}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-400"></div>
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{getTranslation('step1')}</h2>
                  <p className="text-zinc-400">Define the core parameters of the trade.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Product</label>
                    <input value={product} onChange={e => setProduct(e.target.value)} className="w-full bg-black/50 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Quantity (Tons)</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-black/50 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Price per Ton (USDC)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/50 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Total Value (USDC)</label>
                    <div className="w-full bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 font-mono font-bold">
                      {totalValue.toLocaleString()} USDC
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Incoterms</label>
                    <select value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="w-full bg-black/50 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white transition-all outline-none appearance-none">
                      <option>CIF</option><option>FOB</option><option>DAP</option><option>EXW</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Port / Location</label>
                    <input value={deliveryPort} onChange={e => setDeliveryPort(e.target.value)} className="w-full bg-black/50 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white transition-all outline-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{getTranslation('step2')}</h2>
                  <p className="text-zinc-400">Select the independent verifier (Oracle) that will unlock the funds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setOracle('sgs')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${oracle === 'sgs' ? 'bg-emerald-900/20 border-emerald-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                      <ShieldCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">SGS Inspector</h3>
                    <p className="text-sm text-zinc-400">Manual verification of physical documents and lab quality tests.</p>
                  </div>
                  
                  <div 
                    onClick={() => setOracle('iot')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${oracle === 'iot' ? 'bg-emerald-900/20 border-emerald-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                      <Navigation className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">IoT Sensor Array</h3>
                    <p className="text-sm text-zinc-400">Automated unlocking based on GPS arrival and telemetry data.</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-white mb-4">Required Documents Checklist</h4>
                  <div className="space-y-3">
                    {['Proforma Invoice', 'Bill of Lading (B/L)', 'Quality & Moisture Certificate'].map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-zinc-800/50">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span className="text-zinc-300 text-sm">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{getTranslation('step3')}</h2>
                  <p className="text-zinc-400">Review parameters before deploying to the blockchain.</p>
                </div>

                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6">
                  <h4 className="text-emerald-400 text-sm font-mono font-bold mb-4 flex items-center gap-2">
                    <Blocks className="w-4 h-4" /> ESCROW_CONTRACT_DRAFT
                  </h4>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-500">Asset</span>
                      <span className="text-white font-medium">{quantity}t {product}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-500">Locked Value</span>
                      <span className="text-white font-medium font-mono">{totalValue.toLocaleString()} USDC</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-500">Buyer</span>
                      <span className="text-white font-medium font-mono text-xs">{buyerWallet}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-500">Seller</span>
                      <span className="text-white font-medium font-mono text-xs">{sellerWallet}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-500">Oracle Authority</span>
                      <span className="text-white font-medium uppercase">{oracle}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-500">Platform Fee</span>
                      <span className="text-emerald-400 font-medium font-mono">0.25%</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800/50">
            <button 
              onClick={() => setStep(step - 1)}
              className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <ArrowLeft className="w-4 h-4" /> {getTranslation('back')}
            </button>

            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="bg-white text-zinc-950 px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
              >
                {getTranslation('next')} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleDeploy}
                disabled={submitting}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 transition-colors disabled:opacity-50 relative overflow-hidden group shadow-[0_0_20px_rgba(5,150,105,0.3)]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> {getTranslation('deploying')}
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 relative z-10" /> <span className="relative z-10">{getTranslation('deploy')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
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
      <NewTradeWizard />
    </Suspense>
  );
}
