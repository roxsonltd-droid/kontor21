"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Blocks, Wallet, Bell, Globe, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKontorEscrow } from '@/hooks/useKontorEscrow';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { address, formattedAddress, isConnecting, connect } = useKontorEscrow();
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kontor_notif_prefs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { email: true, push: true };
        }
      }
    }
    return { email: true, push: true };
  });
  const [saved, setSaved] = useState(false);

  const toggleNotif = (key: 'email' | 'push') => {
    setNotifications((prev: { email: boolean; push: boolean }) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('kontor_notif_prefs', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-amber-500/30">
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky w-full top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-bold text-white tracking-tight">Kontor 21</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {address ? (
              <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-900/50 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-xs font-medium text-amber-400 font-mono">{formattedAddress}</span>
              </div>
            ) : (
              <button onClick={connect} disabled={isConnecting} className="flex items-center gap-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 hover:bg-amber-600/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                <Wallet className="w-4 h-4" />
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{t('settings.title')}</h1>
          <p className="text-zinc-500">{t('settings.desc')}</p>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/50">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('settings.wallet')}</h2>
                <p className="text-xs text-zinc-500">{t('settings.walletDesc')}</p>
              </div>
            </div>
            {address ? (
              <div className="flex items-center gap-3 bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-mono text-zinc-300">{address}</span>
              </div>
            ) : (
              <button onClick={connect} disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-5 rounded-xl text-sm font-semibold transition-all"
              >
                {isConnecting ? t('nav.connecting') : t('nav.connect')}
              </button>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/50">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('settings.language')}</h2>
                <p className="text-xs text-zinc-500">{t('settings.languageDesc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {(['EN', 'DE', 'BG'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    language === lang
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {lang === 'EN' ? '🇬🇧 English' : lang === 'DE' ? '🇩🇪 Deutsch' : '🇧🇬 Български'}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/50">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('settings.notifPref')}</h2>
                <p className="text-xs text-zinc-500">{t('settings.notifDesc')}</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { key: 'email' as const, label: t('settings.emailNotif') },
                { key: 'push' as const, label: t('settings.pushNotif') },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <button
                    onClick={() => toggleNotif(key)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${notifications[key] ? 'bg-blue-600' : 'bg-zinc-700'}`}
                    aria-label={label}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications[key] ? 'left-[22px]' : 'left-0.5'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex justify-end items-center gap-4 pt-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)]"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
