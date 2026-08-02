"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Gavel, Blocks, ArrowRight, MessageSquareWarning, CheckCircle2, Loader2, Navigation, Activity, Thermometer, Droplets, ArrowDownUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ArbitrationDashboard() {
  const { language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedTrade, setResolvedTrade] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<boolean>(false);
  const [processingAction, setProcessingAction] = useState<'refund' | 'release' | null>(null);

  // Local translations for stability
  const at = {
    title: { EN: "Dispute Resolution", DE: "Streitbeilegung", BG: "Арбитражен Център" },
    panelTitle: { EN: "Active Arbitration Cases", DE: "Aktive Schiedsverfahren", BG: "Активни Арбитражни Дела" },
    panelDesc: { EN: "Review immutable IoT evidence and execute smart contract resolutions.", DE: "Überprüfen Sie unveränderliche IoT-Beweise und führen Sie Smart-Contract-Beschlüsse aus.", BG: "Преглед на неизменяеми IoT доказателства и изпълнение на блокчейн резолюции." },
    disputed: { EN: "DISPUTED", DE: "UMSTRITTEN", BG: "СПОР" },
    locked: { EN: "Locked Value", DE: "Gesperrter Wert", BG: "Замразена Сума" },
    invTitle: { EN: "Trade #104 - Investigation", DE: "Trade #104 - Untersuchung", BG: "Сделка #104 - Разследване" },
    claimTitle: { EN: "Automated Dispute Trigger", DE: "Automatischer Streitfall-Auslöser", BG: "Автоматичен Тригер на Спора" },
    claimText: { EN: "Smart contract automatically froze funds because IoT Sensor Array detected moisture levels exceeding the 8.0% threshold during sea transit.", DE: "Der Smart Contract hat die Gelder automatisch eingefroren, da das IoT-Sensor-Array Feuchtigkeitswerte feststellte, die den Schwellenwert von 8,0 % während des Seetransports überschritten.", BG: "Смарт договорът автоматично замрази средствата, тъй като IoT сензорите отчетоха нива на влажност, надвишаващи прага от 8.0% по време на морския транспорт." },
    evidence: { EN: "Immutable Evidence (IPFS & IoT)", DE: "Unveränderliche Beweise (IPFS & IoT)", BG: "Неизменяеми Доказателства (IPFS и IoT)" },
    decision: { EN: "Blockchain Resolution", DE: "Blockchain-Auflösung", BG: "Блокчейн Резолюция (Отсъждане)" },
    refundBtn: { EN: "Refund Buyer (41,000 USDC)", DE: "Käufer erstatten (41.000 USDC)", BG: "Върни парите на Купувача" },
    releaseBtn: { EN: "Override & Release to Seller", DE: "Überschreiben & an Verkäufer freigeben", BG: "Освободи към Продавача" },
    resolvedTitle: { EN: "Dispute Resolved", DE: "Streitfall gelöst", BG: "Спорът е разрешен" },
    resolvedText: { EN: "The smart contract has executed the resolution. Funds have been distributed accordingly.", DE: "Der Smart Contract hat die Auflösung ausgeführt. Die Gelder wurden entsprechend verteilt.", BG: "Смарт договорът изпълни резолюцията. Средствата бяха преведени автоматично." }
  };

  const getTranslation = (key: keyof typeof at) => at[key][language] || at[key].EN;

  const handleResolve = async (action: 'refund' | 'release') => {
    setProcessingAction(action);
    setIsProcessing(true);
    
    // Simulate Blockchain execution
    setTimeout(() => {
      setIsProcessing(false);
      setResolvedTrade('104');
    }, 3000);
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
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-zinc-300 font-mono">0xAdmin...94A2</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{getTranslation('panelTitle')}</h1>
          <p className="text-sm text-zinc-400 max-w-2xl">{getTranslation('panelDesc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Dispute List (Sidebar) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Queue (1)</h3>
            </div>
            
            {resolvedTrade !== '104' ? (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDispute(true)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedDispute ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.15)]' : 'bg-zinc-900/40 border-zinc-800 hover:border-red-900/50'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-white flex items-center gap-2 font-bold">
                    <ShieldAlert className="w-4 h-4 text-red-500" /> Trade #104
                  </span>
                  <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded uppercase tracking-wider">{getTranslation('disputed')}</span>
                </div>
                <h4 className="text-sm font-medium text-zinc-300 mb-1">High-Oleic Sunflower Seeds</h4>
                <p className="text-xs text-zinc-500 mb-4">Volume: 50 Tons</p>
                
                <div className="bg-black/50 rounded-lg p-3 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">{getTranslation('locked')}</p>
                  <p className="text-lg text-red-400 font-mono font-bold">41,000 USDC</p>
                </div>
              </motion.div>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-900/20 border border-emerald-900/30 opacity-60">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-mono text-zinc-400 line-through">Trade #104</span>
                  <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded uppercase">RESOLVED</span>
                </div>
              </div>
            )}
          </div>

          {/* Dispute Details Panel (Main) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {resolvedTrade === '104' ? (
                <motion.div 
                  key="resolved"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/20 border border-emerald-900/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full"
                >
                  <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <h2 className="text-2xl font-bold text-white mb-2">{getTranslation('resolvedTitle')}</h2>
                  <p className="text-zinc-400 max-w-md">{getTranslation('resolvedText')}</p>
                  <div className="mt-8 bg-black/40 px-4 py-2 rounded-lg font-mono text-sm text-emerald-400 border border-emerald-900/50">
                    Tx: 0x8a92...f41e
                  </div>
                </motion.div>
              ) : selectedDispute ? (
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
                      <h2 className="text-2xl font-bold text-white">{getTranslation('invTitle')}</h2>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                        <span>Contract: 0x812...A1B2</span>
                        <span>•</span>
                        <span>Oracle: IoT Sensor Network</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 mb-10">
                    {/* The Trigger */}
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-400" /> {getTranslation('claimTitle')}
                      </h3>
                      <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-5 text-sm text-red-200 leading-relaxed shadow-inner">
                        {getTranslation('claimText')}
                      </div>
                    </div>

                    {/* Immutable Evidence */}
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-400" /> {getTranslation('evidence')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* IoT Data Block */}
                        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <Droplets className="w-5 h-5 text-blue-400" />
                              <span className="font-semibold text-white">Moisture Log</span>
                            </div>
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-mono">ALERT</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500">Contract Threshold</span>
                              <span className="text-white font-mono">Max 8.0%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500">Sensor Peak (Day 4)</span>
                              <span className="text-red-400 font-mono font-bold text-sm">9.2%</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden flex">
                              <div className="h-full bg-emerald-500 w-[80%]"></div>
                              <div className="h-full bg-red-500 w-[20%]"></div>
                            </div>
                          </div>
                        </div>

                        {/* Temperature Data Block */}
                        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <Thermometer className="w-5 h-5 text-orange-400" />
                              <span className="font-semibold text-white">Temp Log</span>
                            </div>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono">OK</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500">Contract Threshold</span>
                              <span className="text-white font-mono">Max 25°C</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500">Sensor Peak</span>
                              <span className="text-emerald-400 font-mono text-sm">22°C</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Resolution Action */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-purple-400" /> {getTranslation('decision')}
                    </h3>
                    
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
                          <><ArrowDownUp className="w-4 h-4" /> {getTranslation('refundBtn')}</>
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
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-zinc-800/50 border-dashed rounded-3xl bg-zinc-900/10">
                  <ShieldAlert className="w-16 h-16 text-zinc-800 mb-6" />
                  <h3 className="text-xl font-bold text-zinc-500 mb-2">No Dispute Selected</h3>
                  <p className="text-sm text-zinc-600 max-w-sm">
                    Select a case from the queue to review the immutable evidence and execute a ruling.
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
