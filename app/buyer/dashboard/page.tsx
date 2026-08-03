"use client";
import { signedFetch } from "@/lib/signedFetch";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Blocks, CheckCircle2, ShoppingCart, Clock, AlertCircle, LinkIcon, ShieldCheck, Search, Wallet, ChevronRight, TrendingUp, Cpu, Lock, Factory } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type BuyerTrade = {
  id: string;
  blockchainTradeId: number | null;
  productName: string;
  quantity: string;
  priceUsdc: string;
  operationalStatus: string;
  settlementStatus: string;
  seller: { walletAddress: string };
};

export default function BuyerDashboard() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [trades, setTrades] = useState<BuyerTrade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const { address, formattedAddress, isConnecting, connect, fundTrade, approveRelease } = useKontorEscrow();

  useEffect(() => {
    async function fetchTrades() {
      try {
        setLoadingTrades(true);
        const res = await signedFetch(`/api/escrow${address ? `?address=${address}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setTrades(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrades(false);
      }
    }
    fetchTrades();
  }, [address]);

  // Derived stats
  const activeCount = trades.filter(t => t.settlementStatus === "AWAITING_FUNDS" || t.operationalStatus === "PENDING").length;
  const inEscrowUsdc = trades
    .filter(t => t.settlementStatus === "FUNDED" || t.settlementStatus === "PARTIAL_SETTLEMENT")
    .reduce((sum, t) => sum + parseFloat(t.quantity) * parseFloat(t.priceUsdc), 0);
  const completedCount = trades.filter(t => t.settlementStatus === "RELEASED").length;

  const handleFundEscrow = async (tradeId: number) => {
    setIsProcessing(true);
    const success = await fundTrade(tradeId);
    setIsProcessing(false);
    if (success) {
      alert(`Trade #${tradeId} - funds locked in escrow!`);
    } else {
      alert("Error funding trade.");
    }
  };

  const handleApproveRelease = async (trade: BuyerTrade) => {
    if (trade.blockchainTradeId == null) return;
    setIsProcessing(true);
    const success = await approveRelease(trade.blockchainTradeId);
    if (success) {
      await signedFetch(`/api/escrow/${trade.id}`, {
        method: "PATCH",
        body: JSON.stringify({ settlementStatus: "RELEASED" }),
      });
      setTrades((current) =>
        current.map((item) =>
          item.id === trade.id ? { ...item, settlementStatus: "RELEASED" } : item
        )
      );
    } else {
      alert("No pending release proposal or approval failed.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">

      {/* Top Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4 opacity-70 hover:opacity-100 transition-opacity">
              <Blocks className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white tracking-tight">Kontor 21</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
              <a href="#" className="text-white">{t('buyer.title')}</a>
              <Link href="/seller/dashboard" className="hover:text-white transition-colors">Seller</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-zinc-300 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-semibold border border-zinc-700">
              BC
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">{t('buyer.title')}</h1>
            <p className="text-sm text-zinc-500">{t('buyer.subtitle')}</p>
          </div>
        </div>

        {/* AI Market Intelligence Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-8 bg-zinc-900/40 border border-blue-900/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-800/80 pb-4">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white tracking-tight">{t('buyer.aiMarket')}</h2>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 tracking-wider">LIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            
            {/* Trend Forecast */}
            <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-red-400">+12%</span>
                  <span className="block text-[10px] text-zinc-500 uppercase">Q4 Forecast</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-white mb-2">{t('buyer.aiTrend')}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('buyer.aiTrendDesc')}
              </p>
              
              {/* Simulated Chart */}
              <div className="mt-4 h-16 w-full flex items-end gap-1 opacity-80">
                <div className="w-1/6 bg-blue-500/20 rounded-t h-[40%]"></div>
                <div className="w-1/6 bg-blue-500/40 rounded-t h-[45%]"></div>
                <div className="w-1/6 bg-blue-500/60 rounded-t h-[55%]"></div>
                <div className="w-1/6 bg-red-500/40 rounded-t h-[70%]"></div>
                <div className="w-1/6 bg-red-500/60 rounded-t h-[85%] relative">
                  <div className="absolute -top-1 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                </div>
                <div className="w-1/6 bg-red-500/80 rounded-t h-full"></div>
              </div>
            </div>

            {/* Supplier Capacity */}
            <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Factory className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-white mb-2">{t('buyer.aiCapacity')}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t('buyer.aiCapacityDesc')}
              </p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300">Supplier A (BG)</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ready</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-300">Supplier B (RO)</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ready</span>
                </div>
              </div>
            </div>

            {/* Strategic Action */}
            <div className="bg-blue-900/10 border border-blue-900/40 rounded-xl p-5 flex flex-col justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-400"></div>
              <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-2 font-semibold">{t('buyer.aiAction')}</p>
              <h3 className="text-lg font-bold text-white mb-4">Secure Q4 Reserves Before Price Hike</h3>
              
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg text-sm font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 group">
                <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {t('buyer.aiLock')}
              </button>
            </div>

          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">Active</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{t('buyer.active')}</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">{activeCount}</h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">In Escrow</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{t('buyer.inEscrow')}</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">{inEscrowUsdc.toLocaleString()}</h2>
              <span className="text-xs font-medium text-blue-400/80">USDC</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{t('buyer.completed')}</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">{completedCount}</h2>
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
              +3 this month
            </p>
          </motion.div>
        </div>

        {/* Active Trades Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/30">
            <h3 className="text-sm font-semibold text-zinc-200">{t('buyer.waitingDeposit')}</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID..."
                className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 pl-9 pr-3 text-zinc-300 focus:outline-none focus:border-zinc-700 w-48 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Trade ID</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Amount (USDC)</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Seller</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">

                {loadingTrades ? (
                  <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Loading trades...</td></tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-400">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-sm">No trades yet. Start a secure trade.</p>
                        <Link href={`/trade/new`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                          Start Secure Trade <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trades.map(trade => {
                    const totalUsdc = parseFloat(trade.quantity) * parseFloat(trade.priceUsdc);
                    const isDisputed = trade.settlementStatus === "DISPUTED";
                    const isCompleted = trade.settlementStatus === "RELEASED";
                    const needsFunding = trade.settlementStatus === "AWAITING_FUNDS";

                    return (
                      <tr key={trade.id} className={`hover:bg-zinc-800/20 transition-colors group ${isCompleted ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#{trade.id.slice(0,6)}</td>
                        <td className="px-5 py-4 text-zinc-200 font-medium">{trade.productName}, {parseFloat(trade.quantity)}t</td>
                        <td className="px-5 py-4 font-semibold text-white">{totalUsdc.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          {isDisputed ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[11px] font-medium border border-red-500/20">
                              <AlertCircle className="w-3 h-3" /> Disputed
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400/80 text-[11px] font-medium border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : needsFunding ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
                              <Wallet className="w-3 h-3" /> Awaiting Deposit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-medium border border-blue-500/20">
                              <ShieldCheck className="w-3 h-3" /> In Escrow
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-zinc-400">{trade.seller?.walletAddress ? `${trade.seller.walletAddress.slice(0,5)}...${trade.seller.walletAddress.slice(-4)}` : 'N/A'}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {needsFunding && trade.blockchainTradeId != null ? (
                            <button
                              onClick={() => handleFundEscrow(trade.blockchainTradeId!)}
                              disabled={isProcessing || !address}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Wallet className="w-3 h-3" />
                              {isProcessing ? 'Locking...' : 'Deposit'}
                            </button>
                          ) : trade.settlementStatus === "FUNDED" && trade.blockchainTradeId != null ? (
                            <button
                              onClick={() => handleApproveRelease(trade)}
                              disabled={isProcessing || !address}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {isProcessing ? "Approving..." : "Approve release"}
                            </button>
                          ) : (
                            <Link href={`/trade/${trade.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                              {trade.blockchainTradeId != null ? 'View' : 'Deploy'} <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}

              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
