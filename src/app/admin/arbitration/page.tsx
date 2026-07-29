"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Gavel, FileWarning, Search, ChevronRight, CheckCircle2, AlertTriangle, Blocks, Undo2, LogOut, ArrowRight, MessageSquareWarning } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ArbitrationDashboard() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedTrade, setResolvedTrade] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<boolean>(false);
  const { address, formattedAddress, isConnecting, connect, resolveDispute } = useKontorEscrow();
  const tradeId = 1;

  const handleResolve = async (action: 'refund_buyer' | 'release_seller') => {
    setIsProcessing(true);
    const success = await resolveDispute(tradeId, action === 'refund_buyer');
    setIsProcessing(false);
    
    if (success) {
      setResolvedTrade('104');
      setSelectedDispute(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-red-500/30">
      
      {/* Top Navigation (Admin Theme) */}
      <nav className="border-b border-red-900/30 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4 opacity-50">
              <Blocks className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-400 tracking-tight">Kontor 21</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                <Gavel className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-wide uppercase">{t('arb.title')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-medium text-red-400 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button 
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isConnecting ? t('nav.connecting') : t('arb.login')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">{t('arb.panelTitle')}</h1>
          <p className="text-sm text-zinc-500">{t('arb.panelDesc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Dispute List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{t('arb.activeDisputes')} (1)</h3>
            </div>
            
            {resolvedTrade !== '104' && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedDispute(true)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${selectedDispute ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'bg-zinc-900/40 border-zinc-800/80 hover:border-red-900/50'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Trade #104
                  </span>
                  <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">{t('arb.disputed')}</span>
                </div>
                <h4 className="text-base font-semibold text-white mb-1">Sunflower Seeds, 50 t</h4>
                <div className="flex justify-between items-end mt-4">
                  <p className="text-xs text-red-400 font-medium">{t('arb.locked')}: 75,000 USDC</p>
                  <span className="text-[10px] text-zinc-500">{t('arb.timeAgo')}</span>
                </div>
              </motion.div>
            )}

            {resolvedTrade === '104' && (
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 opacity-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-zinc-500">Trade #104</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{t('arb.resolved')}</span>
                </div>
                <h4 className="text-sm font-medium text-zinc-400">Sunflower Seeds, 50 t</h4>
                <p className="text-xs text-zinc-600 mt-1">{t('arb.resolvedDesc')}</p>
              </div>
            )}
          </div>

          {/* Dispute Details Panel */}
          <div className="lg:col-span-7">
            {selectedDispute ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/50 pb-6">
                  <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                    <MessageSquareWarning className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{t('arb.invTitle')}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{t('arb.invDesc')}</p>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">{t('arb.claim')} (0x3A2...9B1)</h3>
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed">
                      {t('arb.claimText')}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">{t('arb.evidence')}</h3>
                    <div className="flex gap-4">
                      <div className="flex-1 flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-colors">
                        <FileWarning className="w-8 h-8 text-yellow-500" />
                        <div>
                          <p className="text-xs font-medium text-white">{t('arb.photo')}</p>
                          <p className="text-[10px] text-zinc-500">IPFS: QmX7c...</p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition-colors">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <div>
                          <p className="text-xs font-medium text-white">SGS Certificate</p>
                          <p className="text-[10px] text-zinc-500">{t('arb.certValid')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-red-400" /> {t('arb.decision')}
                  </h3>
                  
                  {!address ? (
                     <p className="text-xs text-red-400/80 bg-red-950/50 p-3 rounded-lg border border-red-900/50">
                       {t('arb.reqWallet')}
                     </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => handleResolve('refund_buyer')}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Undo2 className="w-4 h-4" />
                        {t('arb.refundBtn')}
                      </button>
                      <button 
                        onClick={() => handleResolve('release_seller')}
                        disabled={isProcessing}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl border border-zinc-700 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {t('arb.releaseBtn')} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-zinc-800/50 border-dashed rounded-2xl bg-zinc-900/20">
                <ShieldAlert className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-lg font-medium text-zinc-400 mb-2">{t('arb.select')}</h3>
                <p className="text-xs text-zinc-600 max-w-sm">
                  {t('arb.selectDesc')}
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
