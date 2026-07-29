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

  // Landing Page — Nav
  "nav.demo": { EN: "Demo Dashboard", DE: "Demo-Dashboard", BG: "Демо Дашборд" },
  "nav.team": { EN: "Talk to the team", DE: "Mit dem Team sprechen", BG: "Говори с екипа" },

  // Landing Page — Hero
  "hero.badge": {
    EN: "The first Web3 escrow platform for agri-trade",
    DE: "Die erste Web3-Treuhandplattform für den Agrarhandel",
    BG: "Първата Web3 ескроу платформа за агро-търговия"
  },

  // Landing Page — Features
  "features.title": {
    EN: "How does programmable escrow work?",
    DE: "Wie funktioniert programmierbare Treuhand?",
    BG: "Как работи програмируемият ескроу?"
  },
  "features.subtitle": {
    EN: "Traditional letters of credit take weeks. We do it in seconds.",
    DE: "Traditionelle Akkreditive dauern Wochen. Wir erledigen es in Sekunden.",
    BG: "Традиционните акредитиви отнемат седмици. Ние го правим за секунди."
  },
  "features.step1Title": {
    EN: "1. Deposit in Smart Contract",
    DE: "1. Einzahlung in Smart Contract",
    BG: "1. Депозит в Смарт Договор"
  },
  "features.step1Desc": {
    EN: "The buyer locks USDC directly in the blockchain (Polygon). Funds are safe and cannot be touched by us or the seller.",
    DE: "Der Käufer sperrt USDC direkt in der Blockchain (Polygon). Das Geld ist sicher und kann weder von uns noch vom Verkäufer berührt werden.",
    BG: "Купувачът заключва средствата в USDC директно в блокчейна (Polygon). Парите са в безопасност и не могат да бъдат докоснати нито от нас, нито от продавача."
  },
  "features.step2Title": {
    EN: "2. Oracles & IoT Data",
    DE: "2. Orakel & IoT-Daten",
    BG: "2. Оракули и IoT Данни"
  },
  "features.step2Desc": {
    EN: "Independent inspectors (like SGS) and IoT sensors feed real-time data to the smart contract. Every condition is mathematically verified.",
    DE: "Unabhängige Prüfer (wie SGS) und IoT-Sensoren speisen Echtzeitdaten in den Smart Contract ein. Jede Bedingung wird mathematisch überprüft.",
    BG: "Независими инспектори (като SGS) и IoT сензори в контейнера подават данни в реално време към смарт договора. Всяко условие е математически проверено."
  },
  "features.step3Title": {
    EN: "3. Automatic Settlement",
    DE: "3. Automatische Abwicklung",
    BG: "3. Автоматичен Сетълмент"
  },
  "features.step3Desc": {
    EN: "When all conditions are met (humidity, location, documents), the code automatically releases the payment to the seller. No waiting for SWIFT transfers.",
    DE: "Wenn alle Bedingungen erfüllt sind (Feuchtigkeit, Standort, Dokumente), gibt der Code die Zahlung automatisch an den Verkäufer frei. Kein Warten auf SWIFT-Überweisungen.",
    BG: "Когато всички условия са изпълнени (влажност, локация, документи), кодът автоматично освобождава плащането към продавача. Без чакане на SWIFT преводи."
  },

  // Landing Page — Comparison
  "compare.title": {
    EN: "Leave banks in the 20th century.",
    DE: "Lassen Sie Banken im 20. Jahrhundert.",
    BG: "Оставете банките в 20-ти век."
  },
  "compare.subtitle": {
    EN: "Cross-border bank transfers cost an average of 6.3% in fees and take up to 7 days. During crises and closed channels, your money remains blocked. With Kontor 21 and USDC, settlement is instant, global, and costs cents.",
    DE: "Grenzüberschreitende Banküberweisungen kosten durchschnittlich 6,3% an Gebühren und dauern bis zu 7 Tage. In Krisen und bei geschlossenen Kanälen bleibt Ihr Geld blockiert. Mit Kontor 21 und USDC ist die Abwicklung sofort, global und kostet Cents.",
    BG: "Трансграничните банкови преводи струват средно 6.3% в такси и отнемат до 7 дни. При кризи и затворени канали, парите ви остават блокирани. С Kontor 21 и USDC, сетълментът е моментален, глобален и струва центове."
  },
  "compare.benefit1": { EN: "Instant settlement (T+0)", DE: "Sofortige Abwicklung (T+0)", BG: "Моментално плащане (T+0 сетълмент)" },
  "compare.benefit2": { EN: "Full protection from currency fluctuations", DE: "Vollständiger Schutz vor Währungsschwankungen", BG: "Пълна защита от валутни колебания" },
  "compare.benefit3": { EN: "Works 24/7, no bank holidays", DE: "Funktioniert 24/7, keine Bankfeiertage", BG: "Работи 24/7, без банкови празници" },
  "compare.traditionalLabel": { EN: "Traditional L/C", DE: "Traditionelles Akkreditiv", BG: "Традиционен Акредитив" },
  "compare.days": { EN: "3-7 Days", DE: "3-7 Tage", BG: "3-7 Дни" },
  "compare.bankFees": { EN: "Bank Fees", DE: "Bankgebühren", BG: "Банкови Такси" },
  "compare.feePercent": { EN: "~2.5% - 6%", DE: "~2,5% - 6%", BG: "~2.5% - 6%" },
  "compare.kontor21": { EN: "Kontor 21 (Smart Escrow)", DE: "Kontor 21 (Smart Escrow)", BG: "Kontor 21 (Smart Escrow)" },
  "compare.instant": { EN: "Instant", DE: "Sofort", BG: "Моментално" },
  "compare.feeLow": { EN: "< 0.1% fee", DE: "< 0,1% Gebühr", BG: "< 0.1% такса" },

  // Trade View — hardcoded text
  "trade.pageDesc": {
    EN: "Review details and payment status for your order.",
    DE: "Überprüfen Sie Details und Zahlungsstatus für Ihre Bestellung.",
    BG: "Преглед на детайли и статус на плащане за вашата поръчка."
  },
  "trade.productSunflower": { EN: "Sunflower (High Oleic)", DE: "Sonnenblume (High Oleic)", BG: "Слънчоглед (Високоолеинов)" },
  "trade.quantityTons": { EN: "50 Tons", DE: "50 Tonnen", BG: "50 Тона" },
  "trade.sellerAddr": { EN: "0x9D4...1F2", DE: "0x9D4...1F2", BG: "0x9D4...1F2" },
  "trade.termsFob": { EN: "FOB Varna", DE: "FOB Varna", BG: "FOB Варна" },
  "trade.docProforma": { EN: "Proforma Invoice.pdf", DE: "Proforma-Rechnung.pdf", BG: "Проформа Фактура.pdf" },
  "trade.docProformaDate": { EN: "Added 2 days ago", DE: "Vor 2 Tagen hinzugefügt", BG: "Добавено преди 2 дни" },
  "trade.docSgs": { EN: "SGS Quality Certificate", DE: "SGS-Qualitätszertifikat", BG: "SGS Сертификат за качество" },
  "trade.docSgsPending": { EN: "Awaiting after loading", DE: "Wird nach dem Laden erwartet", BG: "Очаква се след натоварване" },
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
