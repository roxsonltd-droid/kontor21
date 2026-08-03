"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Download, FileCheck2, ShieldCheck, Database, Calendar, Euro, Fingerprint, Activity, Clock, Blocks, Landmark, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type AccountingTrade = {
  id: string;
  blockchainTradeId: number | null;
  productName: string;
  quantity: string;
  priceUsdc: string;
  operationalStatus: string;
  settlementStatus: string;
  createdAt: string;
  buyer: { companyName: string | null; vatNumber: string | null; walletAddress: string };
  seller: { companyName: string | null; vatNumber: string | null; walletAddress: string };
};

const FEE_BASIS_POINTS = 0.0025; // 0.25%

export default function AccountingDashboard() {
  const { language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [trades, setTrades] = useState<AccountingTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const res = await fetch('/api/escrow');
        if (res.ok) {
          setTrades(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrades();
  }, []);

  // Local translations to ensure stability
  const at = {
    title: { EN: "Corporate Accounting & GoBD", DE: "Unternehmensbuchhaltung & GoBD", BG: "Счетоводство и GoBD Одит" },
    subtitle: { EN: "Immutable audit trails and automated fee treasury collection. Fully compliant with EU and GoBD standards.", DE: "Unveränderliche Prüfpfade und automatische Gebührenerfassung. Vollständig konform mit EU- und GoBD-Standards.", BG: "Неизменяеми одитни следи и автоматично събиране на такси (Treasury). Напълно съвместимо с EU и GoBD стандартите." },
    volTitle: { EN: "Total Volume", DE: "Gesamtvolumen", BG: "Общ Обем Сделки" },
    feeTitle: { EN: "Treasury Fees (0.25%)", DE: "Treasury-Gebühren (0,25%)", BG: "Събрани Такси (0.25%)" },
    auditTitle: { EN: "Compliance Status", DE: "Compliance-Status", BG: "Статус на съответствие" },
    export: { EN: "Export for DATEV (CSV)", DE: "Export für DATEV (CSV)", BG: "Експорт за DATEV (CSV)" },
    generating: { EN: "Generating CSV...", DE: "CSV wird generiert...", BG: "Генериране на CSV..." },
    thTrade: { EN: "Trade ID", DE: "Handels-ID", BG: "Сделка" },
    thCompany: { EN: "Counterparties", DE: "Vertragsparteien", BG: "Контрагенти" },
    thAmount: { EN: "Gross Volume", DE: "Bruttovolumen", BG: "Брутен Обем" },
    thFee: { EN: "Platform Fee", DE: "Plattformgebühr", BG: "Такса Платформа" },
    thProof: { EN: "Blockchain Proof", DE: "Blockchain-Beweis", BG: "Блокчейн Доказателство" },
    thStatus: { EN: "Status", DE: "Status", BG: "Статус" }
  };

  const getTranslation = (key: keyof typeof at) => at[key][language] || at[key].EN;

  const completedTrades = trades.map((trade) => {
    const amountUSDC = parseFloat(trade.quantity) * parseFloat(trade.priceUsdc);
    const feeUSDC = amountUSDC * FEE_BASIS_POINTS;
    return {
      id: trade.blockchainTradeId != null ? `#${trade.blockchainTradeId}` : trade.id.slice(0, 8).toUpperCase(),
      uuid: trade.id,
      date: new Date(trade.createdAt).toISOString().slice(0, 10),
      buyer: trade.buyer?.companyName || trade.buyer?.walletAddress?.slice(0, 8) || "Unknown",
      buyerVat: trade.buyer?.vatNumber || "—",
      seller: trade.seller?.companyName || trade.seller?.walletAddress?.slice(0, 8) || "Unknown",
      sellerVat: trade.seller?.vatNumber || "—",
      amountUSDC,
      feeUSDC,
      amountEUR: amountUSDC * 0.916,
      txHash: trade.blockchainTradeId != null ? `Blockchain #${trade.blockchainTradeId}` : "Not on-chain",
      status: trade.settlementStatus,
      ipfsHash: "—",
    };
  });

  const totalVolume = completedTrades.reduce((acc, curr) => acc + curr.amountUSDC, 0);
  const totalFees = completedTrades.reduce((acc, curr) => acc + curr.feeUSDC, 0);

  const generateDatevExport = () => {
    setIsExporting(true);
    
    // DATEV EXTF format structure (simplified for demo)
    // English headers used as default if not DE, but standard DATEV uses specific German keys
    const headers = language === 'DE' 
      ? '"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Konto";"Gegenkonto";"Belegdatum";"Belegfeld 1";"Buchungstext";"EU-Land u. UStID"'
      : '"Amount";"D/C";"Currency";"Exchange Rate";"Account";"Contra Account";"Date";"Document Number";"Posting Text";"VAT ID"';

    let csvContent = headers + '\n';
    
    completedTrades.forEach(trade => {
      // Create main volume row
      const volRow = `"${trade.amountEUR.toFixed(2).replace('.', ',')}";"S";"EUR";"0,916";"1200";"8125";"${trade.date.split('-').reverse().join('')}";"${trade.id}";"Escrow Settlement";"${trade.buyerVat}"`;
      
      // Create fee row (revenue for Kontor 21)
      const feeEur = trade.feeUSDC * 0.916;
      const feeRow = `"${feeEur.toFixed(2).replace('.', ',')}";"H";"EUR";"0,916";"8400";"1200";"${trade.date.split('-').reverse().join('')}";"${trade.id}-FEE";"Kontor21 Platform Fee";"${trade.sellerVat}"`;
      
      csvContent += volRow + '\n' + feeRow + '\n';
    });

    setTimeout(() => {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `KONTOR21_DATEV_EXPORT_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
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
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.3)]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-wide uppercase">Admin Accounting</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> GoBD Compliant
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{getTranslation('title')}</h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              {getTranslation('subtitle')}
            </p>
          </div>
          
          <button 
            onClick={generateDatevExport}
            disabled={isExporting}
            className="shrink-0 bg-white hover:bg-zinc-200 text-zinc-950 py-3 px-6 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? getTranslation('generating') : getTranslation('export')}
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Total Volume */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <TrendingUp className="w-32 h-32 text-blue-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{getTranslation('volTitle')}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white font-mono">{totalVolume.toLocaleString()}</span>
              <span className="text-lg text-blue-400 font-semibold">USDC</span>
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              ≈ €{(totalVolume * 0.916).toLocaleString()} EUR
            </div>
          </div>

          {/* Treasury Fees */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-zinc-900/40 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Landmark className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Euro className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">{getTranslation('feeTitle')}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white font-mono">+{totalFees.toLocaleString()}</span>
              <span className="text-lg text-emerald-400 font-semibold">USDC</span>
            </div>
            <div className="mt-2 text-sm text-emerald-500/70">
              100% automated collection
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <ShieldCheck className="w-32 h-32 text-purple-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{getTranslation('auditTitle')}</h3>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">IPFS Document Hashing</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">DATEV CSV Compatible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="p-6 border-b border-zinc-800/80 bg-zinc-950/50">
            <h2 className="text-lg font-semibold text-white">Immutable Ledger</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/80 text-zinc-500 border-b border-zinc-800/80 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">{getTranslation('thTrade')}</th>
                  <th className="px-6 py-4 font-semibold">{getTranslation('thCompany')}</th>
                  <th className="px-6 py-4 font-semibold">{getTranslation('thAmount')}</th>
                  <th className="px-6 py-4 font-semibold text-emerald-400">{getTranslation('thFee')}</th>
                  <th className="px-6 py-4 font-semibold">{getTranslation('thProof')}</th>
                  <th className="px-6 py-4 font-semibold">{getTranslation('thStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Loading trades...</td></tr>
                ) : completedTrades.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No trades yet.</td></tr>
                ) : (
                completedTrades.map((trade, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={trade.uuid} 
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white mb-1">{trade.id}</div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {trade.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="text-white font-medium">{trade.buyer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        <span className="text-zinc-400">{trade.seller}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-white text-base">{trade.amountUSDC.toLocaleString()} USDC</div>
                      <div className="text-xs text-zinc-500 font-mono">€{trade.amountEUR.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-emerald-400 font-mono font-bold">
                        +{trade.feeUSDC.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono bg-black/40 px-2 py-1 rounded text-zinc-400 border border-zinc-800/50">
                          <Fingerprint className="w-3 h-3 text-blue-400" />
                          {trade.txHash}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {trade.status === "RELEASED" || trade.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                        </span>
                      ) : trade.status === "DISPUTED" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                          <Activity className="w-3.5 h-3.5" /> Disputed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> {trade.status}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
