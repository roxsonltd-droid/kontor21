"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Blocks, Fingerprint, UploadCloud, FileCheck, Wallet, ArrowRight } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { signedFetch } from '@/lib/signedFetch';

type OracleTrade = {
  id: string;
  blockchainTradeId: number | null;
  productName: string;
  quantity: string;
  unit: string;
  priceUsdc: string;
  operationalStatus: string;
  settlementStatus: string;
  createdAt: string;
  buyer: { walletAddress: string; companyName: string | null };
  seller: { walletAddress: string; companyName: string | null };
  conditions?: { id: string; parameter: string; operator: string; value: string; unit: string | null; providerRole: string }[];
};

export default function OracleDashboard() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState("");
  const [verifiedValue, setVerifiedValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [trades, setTrades] = useState<OracleTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrade, setActiveTrade] = useState<OracleTrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { 
    address, 
    formattedAddress, 
    isConnecting, 
    connect: connectWallet, 
    proposeFullRelease
  } = useKontorEscrow();

  const loadTrades = useCallback(async (wallet: string | null) => {
    try {
      setLoading(true);
      const res = await signedFetch(`/api/escrow?role=oracle&address=${wallet || ''}`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
        const pending = data.find(
          (tr: OracleTrade) =>
            tr.settlementStatus === "FUNDED" ||
            tr.settlementStatus === "PARTIAL_SETTLEMENT"
        ) || data[0] || null;
        setActiveTrade(pending);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrades(address);
  }, [address, loadTrades]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsUploading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await signedFetch("/api/ipfs/upload", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "IPFS upload failed");
        setIpfsHash(result.cid);
      } catch (uploadError) {
        setSelectedFile(null);
        setIpfsHash(null);
        setError(uploadError instanceof Error ? uploadError.message : "IPFS upload failed");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!ipfsHash || !activeTrade || !selectedConditionId || !verifiedValue) return;
    if (activeTrade.blockchainTradeId == null) {
      setError("This trade is not on-chain yet. Create the smart contract from the trade view first.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const evidenceResponse = await signedFetch(`/api/escrow/${activeTrade.id}/evidence`, {
        method: "POST",
        body: JSON.stringify({
          documentHash: ipfsHash,
          providerWallet: address,
          verifiedValue,
          conditionId: selectedConditionId,
        }),
      });
      const evidenceResult = await evidenceResponse.json();
      if (!evidenceResponse.ok) throw new Error(evidenceResult.error || "Evidence validation failed");

      const success = await proposeFullRelease(activeTrade.blockchainTradeId, ipfsHash);
      if (!success) throw new Error("On-chain release proposal failed");

      setIsApproved(true);
      await signedFetch(`/api/escrow/${activeTrade.id}`, {
        method: "PATCH",
        body: JSON.stringify({ operationalStatus: "CONDITIONS_SATISFIED" }),
      });
      await loadTrades(address);
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "Approval failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingTrades = trades.filter(
    (tr) => tr.settlementStatus === "FUNDED" || tr.settlementStatus === "PARTIAL_SETTLEMENT"
  );
  const activeTradeTotal = activeTrade
    ? parseFloat(activeTrade.quantity) * parseFloat(activeTrade.priceUsdc)
    : 0;

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
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4">
              {pendingTrades.length > 0 ? `${pendingTrades.length} awaiting review` : "No pending inspections"}
            </h3>
            
            {loading ? (
              <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center text-sm text-zinc-500">
                Loading trades...
              </div>
            ) : trades.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center text-sm text-zinc-500">
                {address ? "No trades assigned to this wallet." : "Connect your oracle wallet to see assigned trades."}
              </div>
            ) : (
              <>
                {trades.map((trade) => {
                  const isFunded = trade.settlementStatus === "FUNDED" || trade.settlementStatus === "PARTIAL_SETTLEMENT";
                  const isDone = trade.settlementStatus === "RELEASED" || trade.settlementStatus === "REFUNDED";
                  const total = parseFloat(trade.quantity) * parseFloat(trade.priceUsdc);
                  return (
                    <div 
                      key={trade.id}
                      onClick={() => {
                        setActiveTrade(trade);
                        setIpfsHash(null);
                        setSelectedFile(null);
                        setIsApproved(false);
                        setError(null);
                      }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        activeTrade?.id === trade.id
                          ? 'bg-zinc-900/60 border border-emerald-500/30 relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                          : 'bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {activeTrade?.id === trade.id && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-zinc-400">
                          {trade.blockchainTradeId != null ? `Сделка #${trade.blockchainTradeId}` : `Draft ${trade.id.slice(0, 6)}`}
                        </span>
                        {isFunded ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">{t('oracle.actionReq')}</span>
                        ) : isDone ? (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{t('oracle.completed')}</span>
                        ) : (
                          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">AWAITING FUNDS</span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white">{trade.productName}, {parseFloat(trade.quantity)} {trade.unit}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{total.toLocaleString()} USDC</p>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-2">
            {activeTrade ? (
              <motion.div 
                key={activeTrade.id}
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-lg bg-zinc-800/80 text-white">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t('oracle.auth')}</h2>
                    <p className="text-xs text-zinc-500">
                      {activeTrade.productName} {activeTrade.blockchainTradeId != null ? `(Trade #${activeTrade.blockchainTradeId})` : "(not on-chain)"}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950/50 rounded-xl p-5 border border-zinc-800/50 mb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-zinc-800/50 pb-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('oracle.measured')}</p>
                      <p className="text-lg font-mono font-semibold text-white">Pending inspection</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Escrow Value</p>
                      <p className="text-lg font-mono font-medium text-zinc-400">{activeTradeTotal.toLocaleString()} USDC</p>
                    </div>
                  </div>
                  
                  {activeTrade.conditions && activeTrade.conditions.length > 0 && (
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Release Conditions</p>
                      <div className="space-y-1.5">
                        {activeTrade.conditions.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                            <span className="text-emerald-400 font-mono">{c.parameter}</span>
                            <span className="text-zinc-500">{c.operator}</span>
                            <span className="font-mono text-white">{c.value}{c.unit ? ` ${c.unit}` : ""}</span>
                            <span className="ml-auto text-[10px] uppercase text-zinc-600">{c.providerRole}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs text-zinc-400">
                      Condition
                      <select
                        value={selectedConditionId}
                        onChange={(event) => setSelectedConditionId(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white"
                      >
                        <option value="">Select condition</option>
                        {activeTrade.conditions?.map((condition) => (
                          <option key={condition.id} value={condition.id}>
                            {condition.parameter} {condition.operator} {condition.value} {condition.unit || ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-zinc-400">
                      Verified value
                      <input
                        value={verifiedValue}
                        onChange={(event) => setVerifiedValue(event.target.value)}
                        placeholder="Measured value"
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{t('oracle.proof')}</p>
                    {!ipfsHash ? (
                      <div className="relative">
                        <input 
                          type="file" 
                          onChange={handleFileUpload} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          disabled={isUploading}
                        />
                        <div className={`flex items-center justify-center gap-2 border-2 border-dashed ${isUploading ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'} rounded-lg p-4 transition-colors`}>
                          <UploadCloud className={`w-5 h-5 ${isUploading ? 'text-emerald-400 animate-bounce' : 'text-zinc-500'}`} />
                          <span className="text-sm font-medium text-zinc-400">
                            {isUploading ? 'Uploading to IPFS...' : 'Click to upload inspection report'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-2.5">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-400/90 truncate">{selectedFile?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase">CID</span>
                          <span className="text-xs font-mono text-zinc-400 truncate">{ipfsHash}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3">
                    {error}
                  </div>
                )}

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
                        disabled={isProcessing || !ipfsHash || !selectedConditionId || !verifiedValue || activeTrade.blockchainTradeId == null}
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

                {activeTrade.blockchainTradeId == null && !isApproved && (
                  <p className="text-[10px] text-amber-500/80 mt-4 text-center">
                    This draft is not on-chain yet. It must be deployed from the trade view before it can be approved.
                  </p>
                )}
                
                <div className="mt-6 pt-5 border-t border-zinc-800/60 flex justify-end">
                  <Link href={`/trade/${activeTrade.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                    Open trade details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-zinc-800/50 border-dashed rounded-3xl bg-zinc-900/10">
                <FileCheck className="w-16 h-16 text-zinc-800 mb-6" />
                <h3 className="text-xl font-bold text-zinc-500 mb-2">No Trade Selected</h3>
                <p className="text-sm text-zinc-600 max-w-sm">
                  Select a trade from the list to upload the inspection report and approve it.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
