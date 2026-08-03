"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, ArrowLeft, Wallet, CheckCircle2, Loader2, Blocks, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { signedFetch } from "@/lib/signedFetch";

function NewTradeWizard() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { address, connectWallet } = useWallet();
  
  // Step State
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ tradeId?: string; kontor21_url?: string } | null>(null);

  // Form State
  const [product, setProduct] = useState(searchParams.get("product") || "High-Oleic Sunflower Seeds");
  const [quantity, setQuantity] = useState(searchParams.get("quantity") || "50");
  const [price, setPrice] = useState(searchParams.get("price") || "820");
  const buyerWallet = searchParams.get("buyer") || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const [deliveryTerms, setDeliveryTerms] = useState(searchParams.get("terms") || "FOB");
  const [deliveryPort, setDeliveryPort] = useState(searchParams.get("port") || "Varna");
  const [oracle, setOracle] = useState("sgs");
  const [oracleWallet, setOracleWallet] = useState(searchParams.get("oracle") || "");
  
  // Nexus Core: Structured Conditions
  const [conditions, setConditions] = useState([
    { id: 1, parameter: "moisture", operator: "<=", value: "8.0", unit: "%", providerRole: "LAB", isRequired: true },
    { id: 2, parameter: "weight", operator: ">=", value: quantity, unit: "tons", providerRole: "INSPECTOR", isRequired: true }
  ]);
  
  const addCondition = () => {
    setConditions([...conditions, { id: Date.now(), parameter: "", operator: "==", value: "", unit: "", providerRole: "INSPECTOR", isRequired: true }]);
  };
  
  const updateCondition = (id: number, field: string, val: string) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, [field]: val } : c));
  };
  
  const removeCondition = (id: number) => {
    setConditions(conditions.filter(c => c.id !== id));
  };
  
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
    try {
      const sellerWallet = address || await connectWallet();
      if (!sellerWallet) throw new Error("Connect the seller wallet to create a trade");
      const res = await signedFetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product,
          quantity: parseFloat(quantity),
          priceUsdc: parseFloat(price),
          buyerWallet,
          sellerWallet,
          oracleWallet: oracleWallet || undefined,
          unit: "tons",
          conditions: conditions.map(c => ({
            parameter: c.parameter,
            operator: c.operator,
            value: c.value,
            unit: c.unit,
            providerRole: c.providerRole,
            isRequired: c.isRequired
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to deploy escrow");
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold text-white mb-3">Escrow Draft Created!</h1>
          <p className="text-zinc-400 mb-8 text-lg">
            {language === 'BG' ? 'Сделката е записана. Деплойнирай смарт договора, за да я закотвиш на блокчейна.' : 'Your trade is saved. Deploy the smart contract to anchor it on-chain.'}
          </p>
          <div className="bg-black/30 rounded-xl p-4 mb-8 font-mono text-sm text-zinc-300 border border-zinc-800/50">
            Draft ID: <br/>
            <span className="text-emerald-400">{result.tradeId}</span>
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

                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Oracle Wallet (SGS Inspector)</label>
                  <input
                    value={oracleWallet}
                    onChange={e => setOracleWallet(e.target.value)}
                    placeholder="0x... (optional — required for on-chain deploy)"
                    className="w-full bg-black/50 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white font-mono text-xs transition-all outline-none"
                  />
                </div>

                <div className="mt-8 border-t border-zinc-800/50 pt-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Structured Trade Conditions</h4>
                      <p className="text-xs text-zinc-500">Rules Engine parameters for automatic settlement.</p>
                    </div>
                    <button onClick={addCondition} className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-600/40 transition-colors">
                      + Add Rule
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {conditions.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-zinc-800/50">
                        <select value={c.providerRole} onChange={e => updateCondition(c.id, 'providerRole', e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none">
                          <option value="LAB">LAB</option>
                          <option value="INSPECTOR">INSPECTOR</option>
                          <option value="CARRIER">CARRIER</option>
                          <option value="BUYER">BUYER</option>
                        </select>
                        <input placeholder="Parameter (e.g. moisture)" value={c.parameter} onChange={e => updateCondition(c.id, 'parameter', e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none" />
                        <select value={c.operator} onChange={e => updateCondition(c.id, 'operator', e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none w-16">
                          <option value="<=">&lt;=</option>
                          <option value=">=">&gt;=</option>
                          <option value="==">==</option>
                        </select>
                        <input placeholder="Value" value={c.value} onChange={e => updateCondition(c.id, 'value', e.target.value)} className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none" />
                        <input placeholder="Unit" value={c.unit} onChange={e => updateCondition(c.id, 'unit', e.target.value)} className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none" />
                        <button onClick={() => removeCondition(c.id)} className="text-zinc-600 hover:text-red-400 p-1">✕</button>
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
                      <span className="text-white font-medium font-mono text-xs">{address || "Connect seller wallet"}</span>
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
