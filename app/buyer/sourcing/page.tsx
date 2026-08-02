"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Blocks, Search, Cpu, CheckCircle2, Factory, Scale, FileCheck, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useRouter } from 'next/navigation';

const DUMMY_SUPPLIERS = [
  {
    id: 1,
    name: "BioFood BG Ltd.",
    country: "Bulgaria",
    match: 98,
    price: "1,200",
    capacity: "Immediate (up to 200t)",
    certs: ["Halal", "ISO 9001", "Organic EU"],
    sellerAddress: "0x9D4a...1F2e",
  },
  {
    id: 2,
    name: "AgriTech Romania",
    country: "Romania",
    match: 85,
    price: "1,150",
    capacity: "14 Days lead time",
    certs: ["Halal", "ISO 22000"],
    sellerAddress: "0x3A2b...9B1c",
  },
  {
    id: 3,
    name: "Hellas Naturals",
    country: "Greece",
    match: 72,
    price: "1,400",
    capacity: "Immediate (up to 50t)",
    certs: ["ISO 9001", "Organic EU"], // Missing Halal
    sellerAddress: "0x7C8f...4D2a",
  }
];

export default function SourcingEngine() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasResults(false);
    
    // Simulate AI thinking and network delay
    setTimeout(() => {
      setIsSearching(false);
      setHasResults(true);
    }, 2500);
  };

  const handleGenerateContract = (supplier: typeof DUMMY_SUPPLIERS[0]) => {
    // Generate URL parameters to prefill the New Trade page
    const params = new URLSearchParams({
      seller: supplier.sellerAddress,
      price: supplier.price.replace(',', ''),
      product: query.substring(0, 30) // taking snippet of query as product name
    });
    router.push(`/trade/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-4 opacity-70 hover:opacity-100 transition-opacity">
              <Blocks className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white tracking-tight">Kontor 21</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
              <Link href="/buyer/dashboard" className="hover:text-white transition-colors">{t('buyer.title')}</Link>
              <Link href="/seller/dashboard" className="hover:text-white transition-colors">Seller</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-semibold border border-zinc-700">
              BC
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Cpu className="w-3.5 h-3.5" /> TerraIQ Engine
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">{t('sourcing.title')}</h1>
          <p className="text-lg text-zinc-400">{t('sourcing.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto w-full mb-12 relative z-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-2">
              <div className="pl-4 pr-2 text-zinc-500">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('sourcing.searchPlaceholder')}
                className="flex-1 bg-transparent border-none text-zinc-200 text-lg py-4 focus:outline-none placeholder:text-zinc-600"
                disabled={isSearching}
              />
              <button 
                type="submit"
                disabled={!query.trim() || isSearching}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles className="w-5 h-5" />}
                {t('sourcing.searchBtn')}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        <AnimatePresence>
          {isSearching && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">{t('sourcing.analyzing')}</h3>
              <div className="max-w-md mx-auto h-2 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" 
                  initial={{ width: "0%" }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 2.5, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results State */}
        <AnimatePresence>
          {hasResults && !isSearching && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto w-full"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                {t('sourcing.resultsTitle')}
              </h2>
              
              <div className="space-y-4">
                {DUMMY_SUPPLIERS.map((supplier, idx) => (
                  <motion.div 
                    key={supplier.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    className={`bg-zinc-900/50 border ${idx === 0 ? 'border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'border-zinc-800/80'} rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:bg-zinc-900 transition-colors`}
                  >
                    {idx === 0 && (
                      <div className="absolute top-0 right-0 p-1.5 px-3 bg-blue-500 text-white text-[10px] font-bold tracking-widest uppercase rounded-bl-lg z-10">
                        Best Match
                      </div>
                    )}
                    
                    {/* Left: Supplier Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${idx === 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Factory className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {supplier.name}
                            {supplier.match > 90 && <ShieldCheck className="w-4 h-4 text-emerald-400" title="Verified" />}
                          </h3>
                          <p className="text-sm text-zinc-400">{supplier.country}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {supplier.certs.map(cert => (
                          <span key={cert} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                            <FileCheck className="w-3 h-3" /> {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Middle: Metrics */}
                    <div className="flex-1 grid grid-cols-2 gap-4 border-l border-zinc-800 pl-6">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('sourcing.price')} (USDC/t)</p>
                        <p className="text-lg font-semibold text-white">{supplier.price}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('sourcing.capacity')}</p>
                        <p className="text-sm font-medium text-zinc-300">{supplier.capacity}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('sourcing.matchScore')}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${supplier.match > 90 ? 'bg-emerald-500' : supplier.match > 80 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                              style={{ width: `${supplier.match}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-bold ${supplier.match > 90 ? 'text-emerald-400' : supplier.match > 80 ? 'text-blue-400' : 'text-amber-400'}`}>
                            {supplier.match}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Action */}
                    <div className="md:w-48 flex items-center justify-end md:border-l border-zinc-800 md:pl-6">
                      <button 
                        onClick={() => handleGenerateContract(supplier)}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:scale-105 ${idx === 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                      >
                        {idx === 0 ? 'Create Escrow' : 'Select'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
