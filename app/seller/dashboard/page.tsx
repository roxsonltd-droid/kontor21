"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, X, Blocks, LinkIcon, Wallet, ArrowUpRight, ShieldCheck, Activity, Search, Ship, FileCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { CONTRACT_ADDRESSES } from '@/lib/abis';

export default function SellerDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { address, formattedAddress, isConnecting, connect, createTrade } = useKontorEscrow();

  const handleCreateContract = async () => {
    setIsProcessing(true);
    const testBuyer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const testOracle = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const tradeId = await createTrade(
      testBuyer,
      testOracle,
      75000,
      CONTRACT_ADDRESSES.testUSDC,
      "Сушени кайсии, 12 тона; Влажност < 20%"
    );
    setIsProcessing(false);
    if (tradeId !== null) {
      setIsModalOpen(false);
      alert(`Смарт договорът беше създаден! Trade ID: ${tradeId}`);
    } else {
      alert("Грешка при създаване на договора.");
    }
  };

  const handleWithdraw = async () => {
    alert("Функцията за теглене е достъпна след одобрение от оракул.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
                <Blocks className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Kontor 21</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
              <a href="#" className="text-white">Дашборд</a>
              <a href="#" className="hover:text-white transition-colors">Сделки</a>
              <a href="#" className="hover:text-white transition-colors">Оракули & IoT</a>
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
                className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {isConnecting ? 'Свързване...' : 'Свържи Портфейл'}
              </button>
            )}
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-semibold border border-zinc-700">
              SF
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header & CTA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Преглед на търговеца</h1>
            <p className="text-sm text-zinc-500">Управлявайте вашите смарт договори и ескроу плащания.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Нов Смарт Договор
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">Налични</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Общ Приход</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-2xl font-semibold text-white tracking-tight">154,200</h2>
                <span className="text-xs font-medium text-emerald-400/80">USDC</span>
              </div>
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={isProcessing}
              className="mt-4 w-full flex items-center justify-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-xs font-medium text-white py-2 rounded-lg transition-colors border border-zinc-700/50"
            >
              {isProcessing ? 'Транзакция...' : 'Изтегли (Withdraw)'} <ArrowUpRight className="w-3 h-3" />
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm relative overflow-hidden"
          >
            {/* Soft glow */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">Заключени</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">В Ескроу</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-2xl font-semibold text-white tracking-tight">38,400</h2>
                <span className="text-xs font-medium text-blue-400/80">USDC</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></span>
                1 активна сделка
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">Успешни Сделки</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-2xl font-semibold text-white tracking-tight">47</h2>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
                +12% този месец
              </p>
            </div>
          </motion.div>
        </div>

        {/* Active Trades Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/30">
            <h3 className="text-sm font-semibold text-zinc-200">Активни Сделки</h3>
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
                  <th className="px-5 py-3 font-medium">Оракули</th>
                  <th className="px-5 py-3 text-right font-medium">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                
                {/* Trade 102 */}
                <tr className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#102</td>
                  <td className="px-5 py-4 text-zinc-200 font-medium">Сушени кайсии, 12t</td>
                  <td className="px-5 py-4 font-semibold text-white">38,400</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-medium border border-blue-500/20">
                      <Ship className="w-3 h-3" /> В транзит
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400" title="SGS Одобрено">
                        <FileCheck className="w-3 h-3" />
                      </div>
                      <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-400" title="IoT Активен">
                        <Activity className="w-3 h-3" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href="/trade/123" className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                      Преглед <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>

                {/* Trade 103 */}
                <tr className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#103</td>
                  <td className="px-5 py-4 text-zinc-200 font-medium">Слънчоглед, 50t</td>
                  <td className="px-5 py-4 font-semibold text-zinc-400">75,000</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700">
                      <Wallet className="w-3 h-3" /> Чака депозит
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[10px] text-zinc-600">Няма активни</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                      Преглед <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>

                {/* Trade 101 */}
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
                    <div className="text-[10px] text-zinc-500">Условия изпълнени</div>
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

      {/* New Smart Contract Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/50">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Blocks className="w-4 h-4 text-blue-400" />
                  Нов Смарт Договор
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Стока и Описание</label>
                  <input type="text" placeholder="напр. Сушени кайсии, 12 тона" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Ескроу Сума (USDC)</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-medium text-sm">USDC</div>
                    <input type="number" placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-14 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Условия за освобождаване (Oracles)</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500/50 bg-zinc-950" defaultChecked />
                      <div>
                        <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> SGS Инспекция
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">Изисква подписан сертификат за влажност.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500/50 bg-zinc-950" defaultChecked />
                      <div>
                        <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-400" /> IoT Геолокация
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">Освобождава при влизане в радиус на Порт Пирея.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Отказ
                </button>
                <button 
                  onClick={handleCreateContract}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors shadow-lg"
                >
                  {isProcessing ? 'Подписване...' : 'Генерирай Договор'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
