"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Globe2, ArrowRight, Wallet, Blocks, Zap } from 'lucide-react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-blue-500/30 font-sans">
      
      {/* Navigation */}
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Kontor 21</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">{t('hero.howItWorks')}</a>
            <a href="#tech" className="hover:text-white transition-colors">Технология</a>
            <a href="#security" className="hover:text-white transition-colors">Сигурност</a>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/trade/123" className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors text-sm">
              Демо Дашборд
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Първата Web3 ескроу платформа за агро-търговия
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 max-w-4xl mx-auto leading-tight" dangerouslySetInnerHTML={{ __html: t('hero.title') }}>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/trade/123" className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                {t('hero.startTrade')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 rounded-xl bg-zinc-900 text-white font-semibold border border-zinc-800 hover:bg-zinc-800 transition-colors">
                Говори с екипа
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-950/50 border-y border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Как работи програмируемият ескроу?</h2>
            <p className="text-zinc-400">Традиционните акредитиви отнемат седмици. Ние го правим за секунди.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Депозит в Смарт Договор</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Купувачът заключва средствата в USDC директно в блокчейна (Polygon). Парите са в безопасност и не могат да бъдат докоснати нито от нас, нито от продавача.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Оракули и IoT Данни</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Независими инспектори (като SGS) и IoT сензори в контейнера подават данни в реално време към смарт договора. Всяко условие е математически проверено.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Автоматичен Сетълмент</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Когато всички условия са изпълнени (влажност, локация, документи), кодът автоматично освобождава плащането към продавача. Без чакане на SWIFT преводи.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Оставете банките в 20-ти век.
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Трансграничните банкови преводи струват средно 6.3% в такси и отнемат до 7 дни. При кризи и затворени канали, парите ви остават блокирани. С Kontor 21 и USDC, сетълментът е моментален, глобален и струва центове.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckIcon /> Моментално плащане (T+0 сетълмент)
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckIcon /> Пълна защита от валутни колебания
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <CheckIcon /> Работи 24/7, без банкови празници
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                  <span className="text-zinc-400 font-medium">Традиционен Акредитив</span>
                  <span className="text-red-400 font-mono">3-7 Дни</span>
                </div>
                <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                  <span className="text-zinc-400 font-medium">Банкови Такси</span>
                  <span className="text-red-400 font-mono">~2.5% - 6%</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                      <Blocks className="w-3 h-3 text-white" />
                    </div>
                    Kontor 21 (Smart Escrow)
                  </span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-bold block">Моментално</span>
                    <span className="text-emerald-400/70 text-xs font-mono">&lt; 0.1% такса</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white">Kontor 21</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-zinc-400 mb-1">
              {t('footer.ownedBy')} <strong className="text-white">Agri Nexus Ltd</strong>
            </p>
            <p className="text-xs text-zinc-500">
              Sofia, Bulgaria • {t('footer.contact')}: <a href="mailto:info@agrinexus.eu" className="hover:text-white transition-colors">info@agrinexus.eu</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 3L4.5 8.5L2 6" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
