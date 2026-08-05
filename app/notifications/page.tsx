"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, Blocks, CheckCheck, ShieldCheck, AlertTriangle, Gavel, ArrowRight, Server, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';
import { signedFetch } from '@/lib/signedFetch';

import { useEffect } from 'react';

type NotificationItem = {
  id: string;
  type: string;
  tradeId: string | number | null;
  read: boolean;
  time: string;
  system: string;
  details: string | null;
};

const NOTIF_STYLES: Record<string, { icon: React.ReactNode, bg: string, text: string, border: string }> = {
  created: { icon: <Server className="w-5 h-5" />, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  funded: { icon: <ShieldCheck className="w-5 h-5" />, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  approved: { icon: <CheckCircle2 className="w-5 h-5" />, bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  disputed: { icon: <AlertTriangle className="w-5 h-5" />, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  resolved: { icon: <Gavel className="w-5 h-5" />, bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
};

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useKontorEscrow();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchLogs() {
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await signedFetch(`/api/notifications`);
        if (res.ok) {
          const data = await res.json();
          const transformed = data.map((log: { id: string; event: string; title: string; body: string; createdAt: string; readAt?: string | null }, i: number) => {
            const eventName = log.event || "";
            let type = 'created';
            let system = 'System';
            if (eventName.includes('funded')) { type = 'funded'; system = 'Blockchain'; }
            if (eventName.includes('release')) { type = 'approved'; system = 'Rules Engine'; }
            if (eventName.includes('dispute')) { type = 'disputed'; system = 'Rules Engine'; }
            if (eventName.includes('resolved') || eventName.includes('refunded')) { type = 'resolved'; system = 'Oracle'; }

            return {
              id: log.id,
              type,
              tradeId: null,
              read: Boolean(log.readAt) || i > 2,
              time: new Date(log.createdAt).toLocaleString(),
              system,
              details: log.body || log.title
            };
          });
          setNotifications(transformed);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [address]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string | number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || n.system.toLowerCase().includes(filter));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30 flex flex-col">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white tracking-tight">Kontor 21</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-semibold border border-zinc-700">
              BC
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Mission Control Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Cpu className="w-3.5 h-3.5" /> Event Stream
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              {t('notif.title')}
              {unreadCount > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
            </h1>
            <p className="text-zinc-400 text-sm">{t('notif.emptyDesc')}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex p-1">
              {['all', 'ai', 'iot', 'blockchain'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md uppercase tracking-wider transition-colors ${filter === f ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 whitespace-nowrap"
              >
                <CheckCheck className="w-3.5 h-3.5" /> {t('notif.markAll')}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <h3 className="text-lg font-medium text-zinc-400 mb-2">Loading...</h3>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Cpu className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">{t('notif.empty')}</h3>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-zinc-800"></div>

            <div className="space-y-6">
              <AnimatePresence>
                {filteredNotifications.map((notif, i) => {
                  const style = NOTIF_STYLES[notif.type];
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="relative pl-16 group"
                    >
                      {/* Timeline Node */}
                      <div className={`absolute left-5 top-5 w-3 h-3 rounded-full border-2 border-zinc-950 z-10 ${!notif.read ? style.bg.replace('/10', '') : 'bg-zinc-700'}`}></div>

                      <div 
                        onClick={() => markAsRead(notif.id)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          !notif.read 
                            ? `bg-zinc-900/60 ${style.border} shadow-[0_0_20px_rgba(0,0,0,0.2)]` 
                            : 'bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${!notif.read ? style.bg : 'bg-zinc-900'} ${!notif.read ? style.text : 'text-zinc-500'}`}>
                            {style.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-zinc-400'}`}>
                                  {t(`notif.${notif.type}`)}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  {notif.system}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{notif.time}</span>
                            </div>
                            
                            <p className="text-sm text-zinc-400 leading-relaxed">
                              {notif.details || t(`notif.desc.${notif.type}`)}
                            </p>
                          </div>

                          <Link
                            href={`/trade/${notif.tradeId}`}
                            className="mt-2 text-zinc-600 group-hover:text-white transition-colors"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
