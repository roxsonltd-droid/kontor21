"use client";

import React, { useState } from 'react';
import { ShieldCheck, Truck, Clock, FileText, Download, CheckCircle, ArrowRight, ShieldAlert, CircleAlert, Wallet } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TradeView() {
  const { t } = useLanguage();
  const [isFunded, setIsFunded] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);
  const { address, formattedAddress, isConnecting, connect, fundTrade, raiseDispute } = useKontorEscrow();
  const tradeId = 1;

  const handleFundEscrow = async () => {
    const success = await fundTrade(tradeId);
    if (success) setIsFunded(true);
  };

  const handleRaiseDispute = async () => {
    const success = await raiseDispute(tradeId);
    if (success) setIsDisputed(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-emerald-900/30 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Kontor 21</span>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-900/50 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-400 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button 
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 text-emerald-400 mb-4">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wider uppercase">{t('trade.secured')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            {t('trade.title')} #104
          </h1>
          <p className="text-lg text-zinc-400">{t('trade.pageDesc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 border-b border-zinc-800 pb-4">{t('trade.details')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">{t('trade.product')}</span>
                  <span className="text-white font-medium">Слънчоглед (Високоолеинов)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">{t('trade.quantity')}</span>
                  <span className="text-white font-medium">50 Тона</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">{t('trade.seller')}</span>
                  <span className="text-emerald-400 font-mono text-sm">0x9D4...1F2</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-500">{t('trade.terms')}</span>
                  <span className="text-white font-medium">FOB Варна</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
                {t('trade.docs')} 
                <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{t('trade.docsNeeded')}</span>
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-white">Проформа Фактура.pdf</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Добавено преди 2 дни</p>
                    </div>
                  </div>
                  <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50 opacity-50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium text-white">SGS Сертификат за качество</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Очаква се след натоварване</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isFunded && !isDisputed && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/10 border border-red-900/30 rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                    <CircleAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('trade.problem')}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{t('trade.problemDesc')}</p>
                    <button 
                      onClick={handleRaiseDispute}
                      className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {t('trade.raiseDispute')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {isDisputed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-red-600/20 border border-red-500/50 rounded-2xl p-6 md:p-8 text-center"
              >
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-500 mb-2">{t('trade.disputed')}</h3>
                <p className="text-sm text-red-400/80">{t('trade.frozen')}</p>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-zinc-900/60 border border-emerald-900/30 rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-6">{t('trade.contract')}</h3>
              
              <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-1">{t('trade.value')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">75,000</span>
                  <span className="text-lg text-zinc-400">USDC</span>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-3.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:via-zinc-800 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full border-4 border-zinc-950 bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl shadow-lg">
                    <h4 className="font-semibold text-white text-sm">{t('trade.stepCreated')}</h4>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full border-4 border-zinc-950 ${isFunded ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 text-zinc-500'} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-500`}>
                    <Wallet className="w-3 h-3" />
                  </div>
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl shadow-lg transition-all ${isFunded ? 'ring-1 ring-emerald-500/50' : ''}`}>
                    <h4 className={`font-semibold text-sm ${isFunded ? 'text-white' : 'text-zinc-400'}`}>{t('trade.stepDeposit')}</h4>
                    {!isFunded && (
                      <p className="text-xs text-zinc-500 mt-1">{t('trade.stepAwaiting')}</p>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full border-4 border-zinc-950 bg-zinc-800 text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Truck className="w-3 h-3" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl shadow-lg opacity-50">
                    <h4 className="font-semibold text-zinc-400 text-sm">{t('trade.stepSGS')}</h4>
                  </div>
                </div>
              </div>

              {!isFunded ? (
                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <button 
                    onClick={handleFundEscrow}
                    disabled={!address}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {!address ? t('nav.connect') : `${t('trade.lockFunds')} 75,000 USDC`} <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {t('trade.guarantee')}
                  </p>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-4 h-4" /> {t('trade.locked')}
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
