"use client";

import React, { useState } from 'react';
import { FileSpreadsheet, Download, FileCheck2, ShieldCheck, Database, Calendar, Euro, Fingerprint, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data for completed trades ready for accounting
const completedTrades = [
  {
    id: "TRD-102",
    date: "2026-07-25",
    buyer: "Agro Export GmbH",
    buyerVat: "DE123456789",
    seller: "BG Wheat Traders OOD",
    sellerVat: "BG987654321",
    amountUSDC: 125000,
    amountEUR: 114500, // Simulated exchange rate applied
    txHash: "0x8f2a...3c9b",
    status: "BOOKED"
  },
  {
    id: "TRD-103",
    date: "2026-07-27",
    buyer: "Hamburg Food Co",
    buyerVat: "DE987654321",
    seller: "Varna Logistics",
    sellerVat: "BG123456789",
    amountUSDC: 42000,
    amountEUR: 38200,
    txHash: "0x1a4b...9e2f",
    status: "PENDING_EXPORT"
  }
];

export default function AccountingDashboard() {
  const [isExporting, setIsExporting] = useState(false);

  // Generates a mock DATEV CSV format
  const generateDatevExport = () => {
    setIsExporting(true);
    
    // Simple CSV structure resembling DATEV standard (EXTF)
    let csvContent = '"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Basisumsatz";"WKZ Basisumsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"Belegdatum";"Belegfeld 1";"Buchungstext";"EU-Land u. UStID"\n';
    
    completedTrades.forEach(trade => {
      // Create a row for DATEV import
      const row = `"${trade.amountEUR.toFixed(2).replace('.', ',')}";"S";"EUR";"";"";"";"1200";"8125";"${trade.date.split('-').reverse().join('')}";"${trade.id}";"Kontor 21 Escrow Settlement";"${trade.buyerVat}"`;
      csvContent += row + '\n';
    });

    // Create a Blob and trigger download
    setTimeout(() => {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DATEV_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation */}
      <nav className="border-b border-blue-900/30 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 mr-4 opacity-50">
              <Database className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-400 tracking-tight">Kontor 21</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-wide uppercase">Счетоводство & GoBD</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Курс USDC/EUR: 0.916</span>
            <div className="w-px h-4 bg-zinc-800 mx-2"></div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> GoBD Compliant
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Финансови Отчети</h1>
            <p className="text-sm text-zinc-500 max-w-2xl">
              Този панел обединява крипто транзакциите с реалните юридически лица. Данните са криптографски защитени чрез IPFS хешове, гарантирайки неизменяемост според изискванията на немските данъчни власти (GoBD).
            </p>
          </div>
          
          <button 
            onClick={generateDatevExport}
            disabled={isExporting}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Генериране...' : 'Експорт за DATEV (CSV)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Общ Обем (Юли)</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">€152,700</span>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Обработени Сделки</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">2</span>
              <span className="text-sm text-blue-400">успешни</span>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24 text-blue-500" />
            </div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Одит статус</h3>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Всички фактури налични</span>
              <span className="text-sm text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Блокчейн подписите съвпадат</span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800/80">
                <tr>
                  <th className="px-6 py-4 font-medium">Сделка</th>
                  <th className="px-6 py-4 font-medium">Дата</th>
                  <th className="px-6 py-4 font-medium">Купувач (EU-Land u. UStID)</th>
                  <th className="px-6 py-4 font-medium">Сума (USDC)</th>
                  <th className="px-6 py-4 font-medium">Еквивалент (EUR)</th>
                  <th className="px-6 py-4 font-medium">Одит Следа (Tx)</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {completedTrades.map((trade, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={trade.id} 
                    className="hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-white">{trade.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {trade.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{trade.buyer}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{trade.buyerVat}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-300">
                      {trade.amountUSDC.toLocaleString()} USDC
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-blue-400 font-semibold">
                        <Euro className="w-3.5 h-3.5" />
                        {trade.amountEUR.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono bg-zinc-950 px-2 py-1 rounded text-zinc-500 border border-zinc-800">
                        <Fingerprint className="w-3 h-3" />
                        {trade.txHash}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {trade.status === 'BOOKED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Осчетоводена
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                          <Clock className="w-3 h-3" /> Чака Експорт
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

// Internal components to keep it in one file
function CheckCircle2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
