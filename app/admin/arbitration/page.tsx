"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Gavel, Blocks, ArrowRight, MessageSquareWarning, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { signedFetch } from '@/lib/signedFetch';

type DisputeTrade = {
  id: string;
  blockchainTradeId: number | null;
  productName: string;
  quantity: string;
  unit: string;
  priceUsdc: string;
  operationalStatus: string;
  settlementStatus: string;
  createdAt: string;
  buyer: { walletAddress: string; companyName: string | null };
  seller: { walletAddress: string; companyName: string | null };
};

export default function ArbitrationDashboard() {
  const { language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'refund' | 'release' | null>(null);
  const [trades, setTrades] = useState<DisputeTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, formattedAddress, isConnecting, connect, voteDispute } = useKontorEscrow();

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await signedFetch('/api/escrow?disputes=1');
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const selectedTrade = trades.find((t) => t.id === selectedId) || null;

  const handleResolve = async (action: 'refund' | 'release') => {
    if (!selectedTrade) return;
    if (selectedTrade.blockchainTradeId == null) {
      setError("This trade is not on-chain yet — cannot execute an on-chain ruling.");
      return;
    }
    setProcessingAction(action);
    setIsProcessing(true);
    setError(null);
    try {
      const refundBuyer = action === 'refund';
      const success = await voteDispute(selectedTrade.blockchainTradeId, refundBuyer);
      if (success) {
        setResolvedId(selectedTrade.id);
        await signedFetch(`/api/escrow/${selectedTrade.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operationalStatus: "CONDITIONS_SATISFIED",
            settlementStatus: refundBuyer ? "REFUNDED" : "RELEASED",
          }),
        });
        await loadDisputes();
      } else {
        setError("On-chain vote failed. Connect an arbitrator wallet on Amoy and retry.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getTranslation = (key: string) => {
    const at: Record<string, { EN: string; DE: string; BG: string }> = {
      title: { EN: "Dispute Resolution", DE: "Streitbeilegung", BG: "Арбитражен Център" },
      panelTitle: { EN: "Active Arbitration Cases", DE: "Aktive Schiedsverfahren", BG: "Активни Арбитражни Дела" },
      panelDesc: { EN: "Review immutable evidence and execute smart contract resolutions.", DE: "Überprüfen Sie unveränderliche Beweise und führen Sie Smart-Contract-Beschlüsse aus.", BG: "Преглед на неизменяеми доказателства и изпълнение на блокчейн резолюции." },
      disputed: { EN: "DISPUTED", DE: "UMSTRITTEN", BG: "СПОР" },
      locked: { EN: "Locked Value", DE: "Gesperrter Wert", BG: "Замразена Сума" },
      evidence: { EN: "Trade Details", DE: "Handelsdetails", BG: "Детайли на сделката" },
      decision: { EN: "Blockchain Resolution", DE: "Blockchain-Auflösung", BG: "Блокчейн Резолюция (Отсъждане)" },
      refundBtn: { EN: "Refund Buyer", DE: "Käufer erstatten", BG: "Върни парите на Купувача" },
      releaseBtn: { EN: "Release to Seller", DE: "An Verkäufer freigeben", BG: "Освободи към Продавача" },
      resolvedTitle: { EN: "Dispute Resolved", DE: "Streitfall gelöst", BG: "Спорът е разрешен" },
      resolvedText: { EN: "The smart contract has executed the resolution. Funds have been distributed accordingly.", DE: "Der Smart Contract hat die Auflösung ausgeführt. Die Gelder wurden entsprechend verteilt.", BG: "Смарт договорът изпълни резолюцията. Средствата бяха преведени автоматично." },
    };
    return at[key]?.[language] || at[key]?.EN || key;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-red-500/30">
      
      {/* Top Navigation */}
      <nav className="border-b border-red-900/30 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
                <Blocks className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Kontor 21</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                <Gavel className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-wide uppercase">{getTranslation('title')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-zinc-300 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isConnecting ? "Connecting..." : "Connect Arbitrator"}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{getTranslation('panelTitle')}</h1>
          <p className="text-sm text-zinc-400 max-w-2xl">{getTranslation('panelDesc')}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Dispute List (Sidebar) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                {loading ? "Loading..." : `Queue (${trades.length})`}
              </h3>
            </div>
            
            {loading ? (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-sm text-zinc-500">
                Loading disputes...
              </div>
            ) : trades.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-sm text-zinc-500">
                No active disputes.
              </div>
            ) : (
              trades.map((trade) => {
                const isResolved = resolvedId === trade.id;
                const total = parseFloat(trade.quantity) * parseFloat(trade.priceUsdc);
                return (
                  <div 
                    key={trade.id}
                    onClick={() => {
                      if (!isResolved) {
                        setSelectedId(trade.id);
                        setError(null);
                      }
                    }}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isResolved
                        ? 'bg-zinc-900/20 border-emerald-900/30 opacity-60'
                        : selectedId === trade.id
                          ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.15)]'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-red-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-sm font-mono flex items-center gap-2 font-bold ${isResolved ? 'text-zinc-400 line-through' : 'text-white'}`}>
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        {trade.blockchainTradeId != null ? `Trade #${trade.blockchainTradeId}` : `Draft ${trade.id.slice(0, 6)}`}
                      </span>
                      {isResolved ? (
                        <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded uppercase">RESOLVED</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded uppercase tracking-wider">{getTranslation('disputed')}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-1">{trade.productName}</h4>
                    <p className="text-xs text-zinc-500 mb-4">Volume: {parseFloat(trade.quantity)} {trade.unit}</p>
                    
                    <div className="bg-black/50 rounded-lg p-3 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">{getTranslation('locked')}</p>
                      <p className="text-lg text-red-400 font-mono font-bold">{total.toLocaleString()} USDC</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dispute Details Panel (Main) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedTrade && resolvedId === selectedTrade.id ? (
                <motion.div 
                  key="resolved"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/20 border border-emerald-900/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full"
                >
                  <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <h2 className="text-2xl font-bold text-white mb-2">{getTranslation('resolvedTitle')}</h2>
                  <p className="text-zinc-400 max-w-md">{getTranslation('resolvedText')}</p>
                </motion.div>
              ) : selectedTrade ? (
                <motion.div 
                  key="active"
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600"></div>
                  
                  <div className="flex items-center gap-4 mb-8 border-b border-zinc-800/50 pb-6">
                    <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                      <MessageSquareWarning className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedTrade.productName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                        <span>Buyer: {selectedTrade.buyer?.companyName || selectedTrade.buyer?.walletAddress?.slice(0, 10)}</span>
                        <span>•</span>
                        <span>Seller: {selectedTrade.seller?.companyName || selectedTrade.seller?.walletAddress?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 mb-10">
                    {/* The Trade */}
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-red-400" /> {getTranslation('evidence')}
                      </h3>
                      <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-5 space-y-3 text-sm shadow-inner">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Product</span>
                          <span className="text-white font-medium">{selectedTrade.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Volume</span>
                          <span className="text-white font-medium">{parseFloat(selectedTrade.quantity)} {selectedTrade.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Locked Value</span>
                          <span className="text-red-400 font-mono font-bold">{(parseFloat(selectedTrade.quantity) * parseFloat(selectedTrade.priceUsdc)).toLocaleString()} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Status</span>
                          <span className="text-white font-mono">{selectedTrade.operationalStatus} / {selectedTrade.settlementStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">On-chain ID</span>
                          <span className="text-white font-mono">{selectedTrade.blockchainTradeId ?? "Not deployed"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Action */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-purple-400" /> {getTranslation('decision')}
                    </h3>
                    
                    {selectedTrade.blockchainTradeId == null ? (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm p-4">
                        This trade is not deployed on-chain. Deploy the smart contract from the trade view before executing a ruling.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => handleResolve('refund')}
                          disabled={isProcessing}
                          className={`flex-1 py-4 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            isProcessing && processingAction === 'refund' 
                              ? 'bg-red-600/50 text-white cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50'
                          }`}
                        >
                          {isProcessing && processingAction === 'refund' ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</>
                          ) : (
                            <>{getTranslation('refundBtn')}</>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleResolve('release')}
                          disabled={isProcessing}
                          className={`flex-1 py-4 px-4 rounded-xl border border-zinc-700 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            isProcessing && processingAction === 'release' 
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                              : 'bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50'
                          }`}
                        >
                          {isProcessing && processingAction === 'release' ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</>
                          ) : (
                            <>{getTranslation('releaseBtn')} <ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-zinc-800/50 border-dashed rounded-3xl bg-zinc-900/10">
                  <ShieldAlert className="w-16 h-16 text-zinc-800 mb-6" />
                  <h3 className="text-xl font-bold text-zinc-500 mb-2">No Dispute Selected</h3>
                  <p className="text-sm text-zinc-600 max-w-sm">
                    Select a case from the queue to review the details and execute a ruling.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}
