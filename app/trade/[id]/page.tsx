"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, Clock, FileText, Download, CheckCircle, ArrowRight, ShieldAlert, CircleAlert, Wallet, Activity, Ship, Navigation } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

import { useParams } from 'next/navigation';

export default function TradeView() {
  const { t } = useLanguage();
  const params = useParams();
  const tradeId = params.id ? parseInt(params.id as string) : 1;
  
  const [isFunded, setIsFunded] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);
  const [tradeData, setTradeData] = useState<any>(null);
  
  const { address, formattedAddress, isConnecting, connect, fundTrade, raiseDispute, getTrade } = useKontorEscrow();

  React.useEffect(() => {
    if (address) {
      getTrade(tradeId).then(data => {
        if (data) {
          setTradeData(data);
          setIsFunded(data.status >= 1); // 1 = FUNDED, 2 = COMPLETED
          setIsDisputed(data.status === 3); // 3 = DISPUTED
        }
      });
    }
  }, [address, getTrade, tradeId]);

  const handleFundEscrow = async () => {
    const success = await fundTrade(tradeId);
    if (success) {
      setIsFunded(true);
      if (tradeData) setTradeData({ ...tradeData, status: 1 });
    }
  };

  const handleRaiseDispute = async () => {
    const success = await raiseDispute(tradeId);
    if (success) {
      setIsDisputed(true);
      if (tradeData) setTradeData({ ...tradeData, status: 3 });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-emerald-900/30 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Kontor 21</span>
          </Link>
          
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
            </div>

            {/* IoT Telemetry Section (Shown when funded) */}
            {isFunded && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Activity className="w-48 h-48 text-blue-500" />
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2 relative z-10">
                  <Activity className="w-5 h-5 text-blue-400" />
                  {t('trade.telemetryTitle')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  
                  {/* Map / Location Simulation */}
                  <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('trade.liveLocation')}</p>
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          <Ship className="w-4 h-4 text-blue-400" /> {t('trade.vesselStatus')}
                        </h4>
                      </div>
                      <span className="flex h-3 w-3 relative mt-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    </div>
                    
                    <div className="h-32 bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-zinc-900 to-zinc-900"></div>
                      {/* Simulated map points */}
                      <div className="absolute left-[20%] top-[40%] w-2 h-2 rounded-full bg-zinc-700"></div>
                      <div className="absolute left-[20%] top-[40%] w-12 border-t-2 border-dashed border-zinc-700 -rotate-12 origin-left"></div>
                      <div className="absolute left-[50%] top-[30%] w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10">
                        <div className="absolute -inset-2 rounded-full border border-blue-500/50 animate-ping"></div>
                      </div>
                      <div className="absolute left-[50%] top-[30%] w-16 border-t-2 border-dashed border-blue-500/30 rotate-12 origin-left"></div>
                      <div className="absolute left-[80%] top-[45%] w-2 h-2 rounded-full border-2 border-emerald-500"></div>
                      
                      <div className="absolute bottom-2 left-2 right-2 bg-zinc-950/80 rounded px-2 py-1 flex justify-between text-[10px] font-mono text-zinc-400 backdrop-blur-sm border border-zinc-800/50">
                        <span>LAT: 38.214</span>
                        <span>LON: 25.109</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-zinc-400">{t('trade.inTransit')}</span>
                      <span className="text-blue-400 font-medium">{t('trade.eta')}</span>
                    </div>
                  </div>

                  {/* Humidity Sensor */}
                  <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('trade.moistureLevel')}</p>
                      <h4 className="text-sm font-medium text-white mb-1">{t('trade.moistureDesc')}</h4>
                    </div>
                    
                    <div className="my-6">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-mono font-semibold text-white">14.2<span className="text-lg text-zinc-500">%</span></span>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 uppercase block">{t('trade.condition')}</span>
                          <span className="text-xs font-mono text-zinc-400">&lt; 15.0%</span>
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" 
                          initial={{ width: 0 }} 
                          animate={{ width: '90%' }} 
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono">
                        <span>0%</span>
                        <span className="text-emerald-400/80 relative -left-[5%]">14.2%</span>
                        <span>15%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded-lg border border-zinc-800/50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      Сензорът отчита стойности в норма.
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

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
