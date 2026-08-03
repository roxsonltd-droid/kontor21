"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Blocks, Wallet, ArrowRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

type TradeRecord = {
  id: string;
  shortId: string;
  product: string;
  amount: string;
  status: 'active' | 'completed' | 'disputed';
  date: string;
  role: 'buyer' | 'seller' | '';
};

const STATUS_MAP: Record<string, 'active' | 'completed' | 'disputed'> = {
  PENDING: 'active',
  SHIPPED: 'active',
  INSPECTED: 'active',
  CONDITIONS_SATISFIED: 'active',
  DISPUTED: 'disputed',
  COMPLETED: 'completed',
  REFUNDED: 'completed',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <Clock className="w-4 h-4 text-blue-400" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  disputed: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  disputed: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function TradeHistory() {
  const { t } = useLanguage();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'disputed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { address, formattedAddress, isConnecting, connect } = useKontorEscrow();

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch('/api/escrow');
        if (!res.ok) throw new Error('Failed to fetch trades');
        const data = await res.json();
        const mapped: TradeRecord[] = (data as { id: string; productName: string; priceUsdc: string; operationalStatus: string; createdAt: string; buyer?: { walletAddress: string }; seller?: { walletAddress: string } }[]).map((t) => ({
          id: t.id,
          shortId: t.id.slice(0, 8).toUpperCase(),
          product: t.productName,
          amount: Number(t.priceUsdc).toLocaleString(),
          status: STATUS_MAP[t.operationalStatus] || 'active',
          date: new Date(t.createdAt).toISOString().slice(0, 10),
          role: address
            ? t.buyer?.walletAddress?.toLowerCase() === address.toLowerCase()
              ? 'buyer'
              : t.seller?.walletAddress?.toLowerCase() === address.toLowerCase()
                ? 'seller'
                : ''
            : '',
        }));
        setTrades(mapped);
      } catch (err) {
        console.error('[trade-history]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [address]);

  const filteredTrades = trades.filter(trade => {
    const matchesFilter = filter === 'all' || trade.status === filter;
    const matchesSearch = !searchQuery || trade.id.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30">
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-bold text-white tracking-tight">Kontor 21</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-900/50 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium text-blue-400 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button onClick={connect} disabled={isConnecting} className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                <Wallet className="w-4 h-4" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{t('history.title')}</h1>
          <p className="text-zinc-500">{t('history.desc')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'disputed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {t(`history.${f}`)}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('history.search')}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20"
          >
            <Blocks className="w-12 h-12 text-zinc-700 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">{t('history.loading') || 'Loading...'}</h3>
          </motion.div>
        ) : filteredTrades.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20"
          >
            <Blocks className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">{t('history.noTrades')}</h3>
            <p className="text-sm text-zinc-600">{t('history.noTradesDesc')}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTrades.map((trade, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                key={trade.id}
                className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 transition-colors">
                      {STATUS_ICONS[trade.status]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-zinc-500">#{trade.shortId}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[trade.status]}`}>
                          {t(`history.${trade.status}`)}
                        </span>
                        <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">{trade.role}</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-0.5">{trade.product}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-white">{trade.amount} USDC</p>
                      <p className="text-[10px] text-zinc-500">{trade.date}</p>
                    </div>
                    <Link
                      href={`/trade/${trade.id}`}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      {t('history.actions')} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
