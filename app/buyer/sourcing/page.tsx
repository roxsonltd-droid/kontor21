"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Blocks, Search, Cpu, CheckCircle2, Factory, Scale, ArrowRight, Sparkles, ShieldCheck, TrendingUp, Anchor, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useRouter } from 'next/navigation';

const DUMMY_SUPPLIERS = [
  {
    id: 1,
    name: "BioFood BG Ltd.",
    country: "Bulgaria",
    riskScore: 87,
    priceForecast: "+5% (Stable)",
    harvestForecast: "Normal yield",
    containerAvail: "High (Port of Varna)",
    price: "1,200",
    compliance: ["Halal", "ISO 9001", "EU GoBD", "Organic EU"],
    sellerAddress: "0x9D4a...1F2e",
    recommendation: "Strong Buy. Best overall risk/reward ratio."
  },
  {
    id: 2,
    name: "AgriTech Romania",
    country: "Romania",
    riskScore: 65,
    priceForecast: "+12% (Volatile)",
    harvestForecast: "Drought impact expected",
    containerAvail: "Medium (Port of Constanta)",
    price: "1,150",
    compliance: ["Halal", "ISO 22000"],
    sellerAddress: "0x3A2b...9B1c",
    recommendation: "Hold. Monitor harvest data closely."
  },
  {
    id: 3,
    name: "Hellas Naturals",
    country: "Greece",
    riskScore: 72,
    priceForecast: "+2% (Stable)",
    harvestForecast: "Excellent yield",
    containerAvail: "Low (Delays expected)",
    price: "1,400",
    compliance: ["ISO 9001", "Organic EU"], // Missing Halal
    sellerAddress: "0x7C8f...4D2a",
    recommendation: "Avoid. Missing critical certification (Halal)."
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

  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

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
            <Cpu className="w-3.5 h-3.5" /> Kontor21 Intelligence
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Market Intelligence & Supplier Risk</h1>
          <p className="text-lg text-zinc-400">Find verified suppliers, analyze harvest forecasts, and automate your compliance checks.</p>
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
                placeholder="e.g. Tomato powder, Halal certified, delivery to Hamad Port"
                className="flex-1 bg-transparent border-none text-zinc-200 text-lg py-4 focus:outline-none placeholder:text-zinc-600"
                disabled={isSearching}
              />
              <button 
                type="submit"
                disabled={!query.trim() || isSearching}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles className="w-5 h-5" />}
                Analyze
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
              <h3 className="text-xl font-medium text-white mb-2">Compiling Market Intelligence...</h3>
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
              className="max-w-5xl mx-auto w-full"
            >
              {/* Intelligence Header */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 text-sm font-mono">
                <div className="flex items-center gap-2 text-blue-400">
                  <Info className="w-4 h-4" />
                  <span className="font-semibold uppercase tracking-wider">Market Intelligence</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>Generated: {todayDate}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Confidence: 89%</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Sources: Kontor21 Network, Market APIs</span>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Intelligence Report & Supplier Ranking
              </h2>
              
              <div className="space-y-6">
                {DUMMY_SUPPLIERS.map((supplier, idx) => (
                  <motion.div 
                    key={supplier.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    className={`bg-zinc-900/40 border ${idx === 0 ? 'border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.05)]' : 'border-zinc-800/80'} rounded-2xl overflow-hidden group hover:bg-zinc-900 transition-colors`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* Column 1: Supplier ID & Risk Score */}
                        <div className="lg:w-1/4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-white">{supplier.name}</h3>
                              {supplier.riskScore > 80 && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <p className="text-sm text-zinc-400 flex items-center gap-1">
                              <Factory className="w-3.5 h-3.5" /> {supplier.country}
                            </p>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Supplier Trust Score</p>
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-bold ${supplier.riskScore > 80 ? 'text-emerald-400' : supplier.riskScore > 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                                {supplier.riskScore}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Column 2: Market Intelligence */}
                        <div className="lg:w-1/3 grid grid-cols-2 gap-x-4 gap-y-4 lg:border-l border-zinc-800 lg:pl-6">
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Price Forecast</p>
                            <p className="text-sm font-medium text-white">{supplier.priceForecast}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> Harvest</p>
                            <p className="text-sm font-medium text-zinc-300">{supplier.harvestForecast}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Anchor className="w-3 h-3"/> Logistics / Container Avail.</p>
                            <p className="text-sm font-medium text-zinc-300">{supplier.containerAvail}</p>
                          </div>
                        </div>

                        {/* Column 3: Compliance & Actions */}
                        <div className="lg:w-5/12 flex flex-col justify-between lg:border-l border-zinc-800 lg:pl-6">
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Scale className="w-3 h-3"/> Compliance Checks</p>
                            <div className="flex flex-wrap gap-1.5">
                              {supplier.compliance.map(cert => (
                                <span key={cert} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Est. Price</p>
                              <p className="text-lg font-mono text-white">{supplier.price} <span className="text-xs text-zinc-500">USDC/t</span></p>
                            </div>
                            <button 
                              onClick={() => handleGenerateContract(supplier)}
                              className={`py-2 px-5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${idx === 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                            >
                              Create Escrow <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                    {/* Recommendation Footer */}
                    <div className={`px-6 py-2.5 border-t ${idx === 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : supplier.riskScore < 75 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-800/50 border-zinc-800 text-zinc-400'} text-xs font-medium flex items-center gap-2`}>
                      <Cpu className="w-3.5 h-3.5" /> {supplier.recommendation}
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
