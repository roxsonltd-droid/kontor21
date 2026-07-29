"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'EN', label: 'English', flag: '🇬🇧' },
    { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'BG', label: 'Български', flag: '🇧🇬' }
  ] as const;

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
      >
        <Globe className="w-4 h-4 opacity-70" />
        <span className="hidden sm:inline">{currentLang.flag} {currentLang.code}</span>
        <span className="sm:hidden">{currentLang.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                    language === lang.code 
                      ? 'bg-zinc-800 text-white font-medium' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    {lang.label}
                  </span>
                  {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
