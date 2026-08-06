"use client";

import React from 'react';
import Link from 'next/link';
import { Blocks, ShieldCheck, Lock, CheckCircle2, Scale } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TrustCenter() {
  const { t } = useLanguage();

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
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-12 border-b border-zinc-800/50 pb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('trust.title')}</h1>
          <p className="text-zinc-400">
            A comprehensive overview of our security, infrastructure, and compliance posture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Transparency Panel */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Smart Contract Escrow</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">{t('trust.network')}</span>
                <span className="text-purple-400 font-mono text-sm">{t('trust.networkValue')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">{t('trust.contract')}</span>
                <span className="text-emerald-400 font-mono text-xs">0x5FC8...F875707</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-zinc-400">{t('trust.status')}</span>
                <span className="text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('trust.statusValue')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400">{t('trust.audit')}</span>
                <span className="text-zinc-500 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('trust.auditValue')}
                </span>
              </div>
            </div>
          </div>

          {/* Architecture Panel */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <Blocks className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">System Architecture</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Non-Custodial Escrow</p>
                  <p className="text-zinc-400 text-xs mt-1">Funds are locked in a verified smart contract on the blockchain. Platform administrators cannot access user funds.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Decentralized Evidence (IPFS)</p>
                  <p className="text-zinc-400 text-xs mt-1">All inspection certificates and trade documents are hashed and stored immutably on IPFS.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Oracle Integration</p>
                  <p className="text-zinc-400 text-xs mt-1">Independent inspectors (e.g. SGS) authenticate via Web3 wallets to sign inspection results directly onto the blockchain.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance and Audit */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <Scale className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-semibold text-white">Compliance & GoBD</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              Kontor21 is designed to support GoBD-aligned record keeping. All financial transactions are cryptographically linked to legal entity identifiers and timestamped on the ledger.
            </p>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500">
                DATEV-compatible exports are generated with complete audit trails, ensuring traceability for European tax authorities.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <Lock className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Security & Audits</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              The escrow contract is deployed and verified on the Polygon Amoy testnet, and all trade records are anchored on-chain.
            </p>
            <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
              Current Status: Live Testnet Deployment (Polygon Amoy). Use testnet assets only.
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
