"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'EN' | 'DE' | 'BG';

interface Translations {
  [key: string]: {
    EN: string;
    DE: string;
    BG: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.escrow": { EN: "Escrow", DE: "Treuhand", BG: "Ескроу" },
  "nav.connect": { EN: "Connect Wallet", DE: "Wallet verbinden", BG: "Свържи портфейл" },
  "nav.connecting": { EN: "Connecting...", DE: "Verbinden...", BG: "Свързване..." },
  "nav.admin": { EN: "Admin", DE: "Admin", BG: "Админ" },
  "nav.seller": { EN: "Seller", DE: "Verkäufer", BG: "Продавач" },

  // Landing Page
  "hero.title": { 
    EN: "Cross-Border Trade Without Boundaries. Trust Through Code.", 
    DE: "Grenzüberschreitender Handel ohne Grenzen. Vertrauen durch Code.", 
    BG: "Търговия без граници. Доверие чрез код." 
  },
  "hero.subtitle": { 
    EN: "The first B2B escrow platform integrating Smart Contracts, physical SGS inspections, and GoBD compliant accounting.", 
    DE: "Die erste B2B-Treuhandplattform, die Smart Contracts, physische SGS-Inspektionen und GoBD-konforme Buchhaltung integriert.", 
    BG: "Първата B2B ескроу платформа, интегрираща смарт договори, физически инспекции от SGS и GoBD съвместимо счетоводство." 
  },
  "hero.startTrade": { EN: "Start Secure Trade", DE: "Sicheren Handel starten", BG: "Започни сигурна сделка" },
  "hero.howItWorks": { EN: "How it works", DE: "Wie es funktioniert", BG: "Как работи" },
  
  // Trade View
  "trade.title": { EN: "Trade", DE: "Handel", BG: "Сделка" },
  "trade.secured": { EN: "Secured Trade", DE: "Gesicherter Handel", BG: "Осигурена Сделка" },
  "trade.details": { EN: "Shipment Details", DE: "Sendungsdetails", BG: "Детайли за пратката" },
  "trade.product": { EN: "Product", DE: "Produkt", BG: "Продукт" },
  "trade.quantity": { EN: "Quantity", DE: "Menge", BG: "Количество" },
  "trade.seller": { EN: "Seller", DE: "Verkäufer", BG: "Продавач" },
  "trade.terms": { EN: "Delivery Terms", DE: "Lieferbedingungen", BG: "Условия за доставка" },
  "trade.docs": { EN: "Documents", DE: "Dokumente", BG: "Документи" },
  "trade.docsNeeded": { EN: "SGS Certificate Required", DE: "SGS-Zertifikat erforderlich", BG: "Необходим SGS Сертификат" },
  "trade.contract": { EN: "Smart Contract Escrow", DE: "Smart Contract Treuhand", BG: "Смарт Договор Ескроу" },
  "trade.value": { EN: "Value", DE: "Wert", BG: "Стойност" },
  "trade.lockFunds": { EN: "Lock", DE: "Sperren", BG: "Заключи" },
  "trade.stepCreated": { EN: "Trade Created", DE: "Handel erstellt", BG: "Сделката е създадена" },
  "trade.stepDeposit": { EN: "Escrow Deposit", DE: "Treuhandeinzahlung", BG: "Депозит в Ескроу" },
  "trade.stepAwaiting": { EN: "Awaiting payment from buyer", DE: "Warten auf Zahlung des Käufers", BG: "Очаква се плащане от купувача" },
  "trade.stepSGS": { EN: "SGS Approval", DE: "SGS-Freigabe", BG: "Одобрение от SGS" },
  "trade.problem": { EN: "Problem with shipment?", DE: "Problem mit der Sendung?", BG: "Проблем с пратката?" },
  "trade.problemDesc": { 
    EN: "If the goods do not meet the requirements, you can freeze the smart contract and raise a dispute to an independent arbitrator.", 
    DE: "Wenn die Ware nicht den Anforderungen entspricht, können Sie den Smart Contract einfrieren und einen Streitfall bei einem unabhängigen Schlichter einreichen.", 
    BG: "Ако стоката не отговаря на изискванията, можете да замразите смарт договора и да повдигнете спор към независим арбитър." 
  },
  "trade.raiseDispute": { EN: "Raise Dispute", DE: "Streitfall eröffnen", BG: "Оспори Сделката" },
  "trade.disputed": { EN: "Trade is disputed", DE: "Handel wird angefochten", BG: "Сделката е оспорена" },
  "trade.frozen": { EN: "Funds are frozen. Awaiting decision by independent arbitrator.", DE: "Gelder sind eingefroren. Warten auf Entscheidung eines unabhängigen Schlichters.", BG: "Средствата са замразени. Очаква се решение от независим арбитър." },
  "trade.guarantee": { EN: "Smart contract guarantees refund on issue.", DE: "Smart Contract garantiert Rückerstattung bei Problemen.", BG: "Смарт договорът гарантира възстановяване при проблем." },
  "trade.locked": { EN: "Funds are locked", DE: "Gelder sind gesperrt", BG: "Средствата са заключени" },

  // Footer
  "footer.ownedBy": { EN: "Owned and operated by", DE: "Eigentum und Betrieb durch", BG: "Собственост на" },
  "footer.contact": { EN: "Contact", DE: "Kontakt", BG: "Контакти" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('EN');

  useEffect(() => {
    // Basic local storage persistence
    const saved = localStorage.getItem('kontor_lang') as Language;
    if (saved && (saved === 'EN' || saved === 'DE' || saved === 'BG')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('kontor_lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
