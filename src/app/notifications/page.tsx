"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Blocks, Wallet, CheckCheck, Clock, ShieldCheck, AlertTriangle, Gavel, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'funded', tradeId: 104, read: false, time: '2 hours ago' },
  { id: 2, type: 'created', tradeId: 104, read: false, time: '1 day ago' },
  { id: 3, type: 'approved', tradeId: 103, read: true, time: '3 days ago' },
  { id: 4, type: 'resolved', tradeId: 102, read: true, time: '5 days ago' },
  { id: 5, type: 'disputed', tradeId: 102, read: true, time: '1 week ago' },
];

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  created: <Clock className="w-4 h-4 text-blue-400" />,
  funded: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  approved: <CheckCheck className="w-4 h-4 text-emerald-400" />,
  disputed: <AlertTriangle className="w-4 h-4 text-red-400" />,
  resolved: <Gavel className="w-4 h-4 text-purple-400" />,
};

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const { address, formattedAddress, isConnecting, connect } = useKontorEscrow();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-purple-500/30">
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-purple-500" />
            <span className="text-lg font-bold text-white tracking-tight">Kontor 21</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-900/50 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-xs font-medium text-purple-400 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button onClick={connect} disabled={isConnecting} className="flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                <Wallet className="w-4 h-4" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{t('notif.title')}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-zinc-500">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-500/20"
            >
              <CheckCheck className="w-4 h-4" />
              {t('notif.markAll')}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Bell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">{t('notif.empty')}</h3>
            <p className="text-sm text-zinc-600">{t('notif.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => markAsRead(notif.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    !notif.read
                      ? 'bg-purple-950/30 border border-purple-900/30 hover:bg-purple-950/50'
                      : 'bg-zinc-900/20 border border-transparent hover:bg-zinc-900/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${!notif.read ? 'bg-purple-500/10' : 'bg-zinc-800'}`}>
                    {NOTIF_ICONS[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-zinc-400'}`}>
                      {t(`notif.${notif.type}`)} #{notif.tradeId}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{notif.time}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                  <Link
                    href={`/trade/${notif.tradeId}`}
                    className="text-zinc-500 hover:text-white transition-colors p-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
