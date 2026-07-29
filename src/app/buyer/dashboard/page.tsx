"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Activity, ShieldCheck, Plus, Search, FileCheck, Ship, CheckCircle2, ChevronRight, Blocks, Link as LinkIcon, ShoppingCart, Clock, AlertCircle } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { CONTRACT_ADDRESSES } from '@/lib/abis';

export default function BuyerDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { address, formattedAddress, isConnecting, connect, fundTrade, getUsdcBalance } = useKontorEscrow();

  const handleFundEscrow = async (tradeId: number) => {
    setIsProcessing(true);
    const success = await fundTrade(tradeId);
    setIsProcessing(false);
    if (success) {
      alert(`Сделка #${tradeId} — средствата са заключени в ескроу!`);
    } else {
      alert("Грешка при финансиране на сделката.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">

      {/* Top Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
                <Blocks className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Kontor 21</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
              <a href="#" className="text-white">Моите Сделки</a>
              <Link href="/seller/dashboard" className="hover:text-white transition-colors">Продавач</Link>
              <Link href="/trade/123" className="hover:text-white transition-colors">Нова Сделка</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
                {isConnecting ? 'Свързване...' : 'Свържи Портфейл'}
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
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Моите Сделки</h1>
            <p className="text-sm text-zinc-500">Управлявайте вашите ескроу плащания и преглеждайте активни сделки.</p>
          </div>
        </div>

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
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">Активни</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Активни Сделки</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">2</h2>
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
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">В Ескроу</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Заключени Средства</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">75,000</h2>
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
            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Завършени Сделки</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-semibold text-white tracking-tight">12</h2>
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
              +3 този месец
            </p>
          </motion.div>
        </div>

        {/* Active Trades Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/30">
            <h3 className="text-sm font-semibold text-zinc-200">Сделки Чакащи Депозит</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Търси по ID или стока..."
                className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 pl-9 pr-3 text-zinc-300 focus:outline-none focus:border-zinc-700 w-48 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Сделка ID</th>
                  <th className="px-5 py-3 font-medium">Стока</th>
                  <th className="px-5 py-3 font-medium">Сума (USDC)</th>
                  <th className="px-5 py-3 font-medium">Статус</th>
                  <th className="px-5 py-3 font-medium">Продавач</th>
                  <th className="px-5 py-3 text-right font-medium">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">

                {/* Trade 103 */}
                <tr className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#103</td>
                  <td className="px-5 py-4 text-zinc-200 font-medium">Слънчоглед, 50t</td>
                  <td className="px-5 py-4 font-semibold text-white">75,000</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
                      <Wallet className="w-3 h-3" /> Чака Депозит
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-zinc-400">0x9D4...1F2</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleFundEscrow(1)}
                      disabled={isProcessing || !address}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wallet className="w-3 h-3" />
                      {isProcessing ? 'Заключване...' : 'Депозирай'}
                    </button>
                  </td>
                </tr>

                {/* Trade 104 — disputed */}
                <tr className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#104</td>
                  <td className="px-5 py-4 text-zinc-200 font-medium">Царевица, 200t</td>
                  <td className="px-5 py-4 font-semibold text-white">120,000</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[11px] font-medium border border-red-500/20">
                      <AlertCircle className="w-3 h-3" /> Спор
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-zinc-400">0x3A2...9B1</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href="/trade/104" className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                      Преглед <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>

                {/* Trade 101 — completed */}
                <tr className="hover:bg-zinc-800/20 transition-colors group opacity-60">
                  <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#101</td>
                  <td className="px-5 py-4 text-zinc-400 font-medium">Пшеница, 200t</td>
                  <td className="px-5 py-4 font-semibold text-zinc-500">120,000</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400/80 text-[11px] font-medium border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Завършена
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] text-zinc-500">Условия изпълнени</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                      Архив <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
