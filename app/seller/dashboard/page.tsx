"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, X, Blocks, Wallet, ArrowUpRight, ShieldCheck, Activity, Search, Ship, FileCheck, ChevronRight, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { CONTRACT_ADDRESSES } from '@/lib/abis';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SellerDashboard() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { address, formattedAddress, isConnecting, connect, createTrade } = useKontorEscrow();

  const [trades, setTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Upload states for active trade action
  const [invoiceUploaded, setInvoiceUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchData, setBatchData] = useState({ truck: '', date: '' });
  const [batchSaved, setBatchSaved] = useState(false);

  useEffect(() => {
    async function fetchTrades() {
      try {
        setLoadingTrades(true);
        const res = await fetch(`/api/escrow${address ? `?address=${address}` : ''}`);
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
  const totalRevenueUsdc = trades
    .filter(t => t.settlementStatus === "COMPLETED")
    .reduce((sum, t) => sum + parseFloat(t.quantity) * parseFloat(t.priceUsdc), 0);
  const inEscrowUsdc = trades
    .filter(t => t.settlementStatus === "FUNDED" || t.settlementStatus === "PARTIAL_RELEASE")
    .reduce((sum, t) => sum + parseFloat(t.quantity) * parseFloat(t.priceUsdc), 0);
  const successfulCount = trades.filter(t => t.settlementStatus === "COMPLETED").length;
  const activeCount = trades.filter(t => t.settlementStatus === "FUNDED" || t.settlementStatus === "PARTIAL_RELEASE" || t.settlementStatus === "AWAITING_FUNDS").length;
  const hasFundedTrade = trades.some(t => t.settlementStatus === "FUNDED" || t.settlementStatus === "PARTIAL_RELEASE");

  const handleCreateContract = async () => {
    setIsProcessing(true);
    const testBuyer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const testOracle = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const tradeId = await createTrade(
      testBuyer,
      testOracle,
      75000,
      CONTRACT_ADDRESSES.testUSDC
    );
    setIsProcessing(false);
    if (tradeId !== null) {
      setIsModalOpen(false);
      alert(`Trade created! ID: ${tradeId}`);
    } else {
      alert("Error creating contract.");
    }
  };

  const handleWithdraw = async () => {
    alert("Withdrawal is available automatically after oracle (SGS) approval. The smart contract will transfer USDC directly to your wallet.");
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        setInvoiceUploaded(true);
        setIsUploading(false);
      }, 1000);
    }
  };

  const handleSaveBatch = () => {
    if (batchData.truck && batchData.date) {
      setBatchSaved(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4 opacity-70 hover:opacity-100 transition-opacity">
              <Blocks className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold text-white tracking-tight">Kontor 21</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
              <a href="#" className="text-white">{t('nav.seller')}</a>
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
                className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
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
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">{t('seller.title')}</h1>
            <p className="text-sm text-zinc-500">{t('seller.subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <Plus className="w-4 h-4" />
            {t('seller.newContract')}
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
            </div>
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{t('seller.totalRevenue')}</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-2xl font-semibold text-white tracking-tight">{totalRevenueUsdc.toLocaleString()}</h2>
                <span className="text-xs font-medium text-emerald-400/80">USDC</span>
              </div>
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={isProcessing}
              className="mt-4 w-full flex items-center justify-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-xs font-medium text-white py-2 rounded-lg transition-colors border border-zinc-700/50"
            >
              {isProcessing ? '...' : t('seller.withdraw')} <ArrowUpRight className="w-3 h-3" />
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-2 py-1 bg-zinc-800/80 text-zinc-400 rounded uppercase tracking-wider">{t('seller.inEscrow')}</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{t('seller.inEscrow')}</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  {inEscrowUsdc.toLocaleString()}
                </h2>
                <span className="text-xs font-medium text-blue-400/80">USDC</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></span>
                {activeCount} active trades
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
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{t('seller.successfulTrades')}</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-2xl font-semibold text-white tracking-tight">{successfulCount}</h2>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Trades & Action Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl backdrop-blur-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/30">
            <h3 className="text-sm font-semibold text-zinc-200">{t('seller.activeTrades')}</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder={t('seller.searchPlaceholder')}
                className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 pl-9 pr-3 text-zinc-300 focus:outline-none focus:border-zinc-700 w-48 transition-colors"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('seller.tradeId')}</th>
                  <th className="px-5 py-3 font-medium">{t('seller.product')}</th>
                  <th className="px-5 py-3 font-medium">{t('seller.amount')}</th>
                  <th className="px-5 py-3 font-medium">{t('seller.status')}</th>
                  <th className="px-5 py-3 font-medium">{t('seller.oracles')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('seller.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                
                {loadingTrades ? (
                  <tr><td colSpan={6} className="text-center py-8 text-zinc-500">Loading trades...</td></tr>
                ) : trades.length === 0 ? (
                  <>
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-400">
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-sm">No live trades yet.</p>
                        </div>
                      </td>
                    </tr>
                    {/* Demo Trade */}
                    <tr className="hover:bg-blue-900/10 transition-colors group bg-blue-500/5 relative">
                      <td className="px-5 py-4 font-mono text-blue-400 text-xs">
                        <div className="flex items-center gap-2">
                          #K21-102
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 uppercase">Demo</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-200 font-medium">12 tons dried apricots</td>
                      <td className="px-5 py-4 font-semibold text-white">14,400</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700">
                          <Wallet className="w-3 h-3" /> {t('seller.statusAwaiting')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <FileCheck className="w-3 h-3" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/trade/123`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                          Explore demo workflow <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  </>
                ) : (
                  trades.map(trade => {
                    const totalUsdc = parseFloat(trade.quantity) * parseFloat(trade.priceUsdc);
                    const isDisputed = trade.settlementStatus === "DISPUTED";
                    const isFunded = trade.settlementStatus === "FUNDED" || trade.settlementStatus === "PARTIAL_RELEASE";
                    const isCompleted = trade.settlementStatus === "COMPLETED";
                    const needsFunding = trade.settlementStatus === "AWAITING_FUNDS";

                    return (
                      <tr key={trade.id} className={`hover:bg-zinc-800/20 transition-colors group ${isCompleted ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4 font-mono text-zinc-400 text-xs">#{trade.id.slice(0,6)}</td>
                        <td className="px-5 py-4 text-zinc-200 font-medium">{trade.productName}, {parseFloat(trade.quantity)}t</td>
                        <td className="px-5 py-4 font-semibold text-white">{totalUsdc.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          {isFunded ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-medium border border-blue-500/20">
                              <ShieldCheck className="w-3 h-3" /> В Ескроу
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400/80 text-[11px] font-medium border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Завършена
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700">
                              <Wallet className="w-3 h-3" /> {t('seller.statusAwaiting')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <FileCheck className="w-3 h-3" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/trade/${trade.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                            {t('history.actions')} <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* Action Required: Upload Invoice & Batch Details (Only shown if Trade 1 is Funded) */}
        {hasFundedTrade && (!invoiceUploaded || !batchSaved) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Action: Funds secured!</h3>
            <p className="text-sm text-zinc-400 mb-6">The buyer locked 75,000 USDC in the smart contract. Upload the invoice and enter batch details to prepare the SGS inspection.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Upload Invoice */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{t('seller.uploadInvoice')}</p>
                {!invoiceUploaded ? (
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={handleInvoiceUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      disabled={isUploading}
                    />
                    <div className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed ${isUploading ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'} rounded-lg p-6 transition-colors`}>
                      <UploadCloud className={`w-6 h-6 ${isUploading ? 'text-blue-400 animate-bounce' : 'text-zinc-500'}`} />
                      <span className="text-sm font-medium text-zinc-400">
                        {isUploading ? 'Uploading...' : 'Click to upload invoice'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="block text-sm font-medium text-emerald-400/90">Invoice 2026-08.pdf</span>
                      <span className="block text-xs text-emerald-500/50">{t('seller.uploadSuccess')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Details */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{t('seller.enterBatch')}</p>
                {!batchSaved ? (
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        placeholder="Truck/Container reg. number" 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        value={batchData.truck}
                        onChange={(e) => setBatchData({ ...batchData, truck: e.target.value })}
                      />
                    </div>
                    <div>
                      <input 
                        type="date" 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                        value={batchData.date}
                        onChange={(e) => setBatchData({ ...batchData, date: e.target.value })}
                      />
                    </div>
                    <button 
                      onClick={handleSaveBatch}
                      disabled={!batchData.truck || !batchData.date}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Save data
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4 h-full">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="block text-sm font-medium text-emerald-400/90">{batchData.truck}</span>
                      <span className="block text-xs text-emerald-500/50">{t('seller.batchSuccess')}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

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
                  {t('seller.newContract')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">{t('seller.product')} and Description</label>
                  <input type="text" placeholder="e.g. Dried apricots, 12 tons" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Escrow Amount (USDC)</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-medium text-sm">USDC</div>
                    <input type="number" placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-14 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Release conditions ({t('seller.oracles')})</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500/50 bg-zinc-950" defaultChecked />
                      <div>
                        <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> SGS Inspection
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">Requires signed moisture certificate.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500/50 bg-zinc-950" defaultChecked />
                      <div>
                        <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-400" /> IoT Geolocation
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">Releases upon entering Port of Piraeus radius.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleCreateContract}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors shadow-lg"
                >
                  {isProcessing ? 'Signing...' : 'Generate Contract'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
