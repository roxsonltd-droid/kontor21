"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Search, FileCheck, CheckCircle2, Blocks, Fingerprint, UploadCloud, Link as LinkIcon, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function OracleDashboard() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const { address, formattedAddress, isConnecting, connectWallet, mockTransaction } = useWallet();

  const handleApprove = async () => {
    setIsProcessing(true);
    const success = await mockTransaction('approve_trade');
    setIsProcessing(false);
    
    if (success) {
      setIsApproved(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">
      
      {/* Top Navigation (Oracle Theme) */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4 opacity-50">
              <Blocks className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-400 tracking-tight">Kontor 21</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <FileCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-wide uppercase">Oracle Network</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-400/80 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-semibold border border-zinc-700">
              SGS
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">{t('oracle.title')}</h1>
          <p className="text-sm text-zinc-500">{t('oracle.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Requests */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4">{t('oracle.pending')}</h3>
            
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/30 relative overflow-hidden group cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-zinc-400">Сделка #102</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">{t('oracle.actionReq')}</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Сушени кайсии, 12 тона</h4>
              <p className="text-xs text-zinc-500 mt-1">Изискване: Влажност &lt; 20%</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 opacity-50 cursor-not-allowed">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-zinc-500">Сделка #098</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{t('oracle.completed')}</span>
              </div>
              <h4 className="text-sm font-medium text-zinc-400">Пшеница, 500 тона</h4>
              <p className="text-xs text-zinc-600 mt-1">Одобрено на 12 юли</p>
            </div>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-zinc-800/80 text-white">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('oracle.auth')}</h2>
                  <p className="text-xs text-zinc-500">Сделка #102 (Смарт Договор: 0x71C...3E94)</p>
                </div>
              </div>

              <div className="bg-zinc-950/50 rounded-xl p-5 border border-zinc-800/50 mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-zinc-800/50 pb-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('oracle.measured')}</p>
                    <p className="text-lg font-mono font-semibold text-white">18.2%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('oracle.limit')}</p>
                    <p className="text-lg font-mono font-medium text-zinc-400">&lt; 20.0%</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{t('oracle.proof')}</p>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                    <UploadCloud className="w-4 h-4 text-emerald-400/80" />
                    <span className="text-xs font-mono text-zinc-400">QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {isApproved ? (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">{t('oracle.success')}</span>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? t('oracle.processing') : t('oracle.approveBtn')}
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                      {t('oracle.rejectBtn')}
                    </button>
                  </>
                )}
              </div>
              
              {!address && !isApproved && (
                <p className="text-[10px] text-zinc-500 mt-4 text-center">
                  {t('oracle.reqWallet')}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
