"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShieldCheck, Truck, Clock, FileText, Download, CheckCircle, ArrowRight, ShieldAlert, CircleAlert, Wallet } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { CONTRACT_ADDRESSES } from '@/lib/abis';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { signedFetch } from '@/lib/signedFetch';

type TradeMetadata = {
  id: string;
  blockchainTradeId: number | null;
  productName: string;
  quantity: string | number;
  unit: string;
  priceUsdc: string | number;
  operationalStatus: string;
  settlementStatus: string;
  buyer: { walletAddress: string; companyName: string | null };
  seller: { walletAddress: string; companyName: string | null };
  oracle?: { walletAddress: string; companyName: string | null } | null;
  conditions?: { parameter: string; operator: string; value: string; unit: string | null; providerRole: string }[];
};

export default function TradeView() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const [trade, setTrade] = useState<TradeMetadata | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFunded, setIsFunded] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const { address, formattedAddress, isConnecting, connect, createTrade, fundTrade, raiseDispute } = useKontorEscrow();
  const blockchainTradeId = trade?.blockchainTradeId ?? null;
  const quantityNum = trade ? parseFloat(trade.quantity.toString()) : 0;
  const priceNum = trade ? parseFloat(trade.priceUsdc.toString()) : 0;
  const totalUsdc = quantityNum * priceNum;
  const [isExporting, setIsExporting] = useState(false);

  const loadTrade = async () => {
    try {
      const response = await signedFetch(`/api/escrow/${encodeURIComponent(params.id)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as TradeMetadata & { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to load trade");
      setTrade(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load trade");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!address) return;
      try {
        const response = await signedFetch(`/api/escrow/${encodeURIComponent(params.id)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as TradeMetadata & { error?: string };
        if (!response.ok) throw new Error(data.error || "Failed to load trade");
        if (!cancelled) setTrade(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load trade");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [params.id, address]);

  const handleCreateContract = async () => {
    if (!trade || !address) return;
    setContractError(null);
    setIsCreating(true);
    try {
      const oracleAddress =
        trade.oracle?.walletAddress ||
        CONTRACT_ADDRESSES.arbitrator1 ||
        CONTRACT_ADDRESSES.arbitrator;
      if (!oracleAddress) {
        setContractError("No oracle wallet is configured for this trade.");
        return;
      }
      const tradeId = await createTrade(
        trade.buyer.walletAddress,
        oracleAddress,
        totalUsdc,
        CONTRACT_ADDRESSES.testUSDC
      );
      if (tradeId == null) {
        setContractError("createTrade failed — check wallet and network (Amoy).");
        return;
      }
      const res = await signedFetch(`/api/escrow/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockchainTradeId: tradeId }),
      });
      if (!res.ok) {
        setContractError("Linked on-chain but failed to save draft — refresh the page.");
        return;
      }
      await loadTrade();
    } catch (error) {
      setContractError(error instanceof Error ? error.message : "Failed to create contract");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFundEscrow = async () => {
    if (blockchainTradeId == null) return;
    const success = await fundTrade(blockchainTradeId);
    if (success) {
      setIsFunded(true);
      await signedFetch(`/api/escrow/${trade?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementStatus: "FUNDED" }),
      });
      await loadTrade();
    }
  };

  const handleRaiseDispute = async () => {
    if (blockchainTradeId == null) return;
    const success = await raiseDispute(blockchainTradeId);
    if (success) {
      setIsDisputed(true);
      await signedFetch(`/api/escrow/${trade?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationalStatus: "DISPUTED", settlementStatus: "DISPUTED" }),
      });
      await loadTrade();
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById("trade-pdf-content");
    if (element) {
      try {
        const canvas = await html2canvas(element, { backgroundColor: '#09090b', scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Trade_Contract_${trade?.id.slice(0, 8)}.pdf`);
      } catch (error) {
        console.error("PDF export failed", error);
      }
    }
    setIsExporting(false);
  };

  if (loadError) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-zinc-200">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="text-xl font-bold text-white">Escrow draft unavailable</h1>
          <p className="mt-2 text-red-200">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!trade) {
    return <main className="min-h-screen bg-zinc-950 p-8 text-zinc-400">Loading escrow draftΓÇª</main>;
  }

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
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {t('trade.title')} #{blockchainTradeId ?? trade.id.slice(0, 8)}
                </h1>
                {blockchainTradeId == null && (
                  <span className="bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Чернова (не на-chain)
                  </span>
                )}
              </div>
              <p className="text-lg text-zinc-400">{t('trade.pageDesc')}</p>
            </div>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Експорт..." : "Изтегли PDF"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="trade-pdf-content">
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 border-b border-zinc-800 pb-4">{t('trade.details')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">{t('trade.product')}</span>
                  <span className="text-white font-medium">{trade.productName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">{t('trade.quantity')}</span>
                  <span className="text-white font-medium">{trade.quantity.toString()} {trade.unit}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">{t('trade.seller')}</span>
                  <span className="text-emerald-400 font-mono text-sm">{trade.seller.walletAddress}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">Logistics Status</span>
                  <span className="text-emerald-400 font-medium">{trade.operationalStatus}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500">Financial Status</span>
                  <span className="text-emerald-400 font-medium">{trade.settlementStatus}</span>
                </div>
                <div className="py-2">
                  <span className="text-zinc-500 block mb-2">{t('trade.terms')} (Rules Engine)</span>
                  {trade.conditions && trade.conditions.length > 0 ? (
                    <div className="space-y-1">
                      {trade.conditions.map((c, i) => (
                        <div key={i} className="text-xs bg-zinc-800/50 p-2 rounded text-zinc-300">
                          <span className="font-semibold text-emerald-400">{c.providerRole}</span> verifies: {c.parameter} {c.operator} {c.value}{c.unit}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-white font-medium">—</span>
                  )}
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
                  <span className="text-4xl font-bold text-white">{totalUsdc.toLocaleString()}</span>
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
                  {blockchainTradeId == null ? (
                    <div className="space-y-3">
                      <div className="text-xs text-zinc-500 bg-zinc-800/40 border border-amber-500/20 rounded-lg p-3">
                        Този escrow е все още чернова — не съществува на блокчейна. Продавачът трябва да създаде смарт договора, за да се отключат финансирането и верификацията.
                      </div>
                      <button
                        onClick={handleCreateContract}
                        disabled={!address || isCreating}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {!address
                          ? t('nav.connect')
                          : isCreating
                            ? "Създаване на договор..."
                            : "Създай Смарт Договор"} <ArrowRight className="w-4 h-4" />
                      </button>
                      {contractError && (
                        <p className="text-[11px] text-red-400 text-center">{contractError}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleFundEscrow}
                        disabled={!address}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {!address
                          ? t('nav.connect')
                          : `${t('trade.lockFunds')} ${totalUsdc.toLocaleString()} USDC`} <ArrowRight className="w-4 h-4" />
                      </button>
                      <p className="text-[10px] text-zinc-500 text-center mt-3 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {t('trade.guarantee')}
                      </p>
                    </>
                  )}
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
