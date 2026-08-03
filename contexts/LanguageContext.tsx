"use client";

import React, { createContext, useContext, useState } from 'react';

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
    EN: "AI Trade Assurance Platform", 
    DE: "AI-Handelssicherungsplattform", 
    BG: "AI Платформа за Търговска Сигурност" 
  },
  "hero.subtitle": { 
    EN: "One trusted workflow from supplier verification to delivery and settlement for secure cross-border agri-trade.", 
    DE: "Ein vertrauenswürdiger Workflow von der Lieferantenprüfung bis zur Lieferung und Abwicklung für sicheren grenzüberschreitenden Agrarhandel.", 
    BG: "Един доверен работен процес от проверка на доставчика до доставка и разплащане за сигурна трансгранична агро-търговия." 
  },
  "hero.startTrade": { EN: "Start Secure Trade", DE: "Sicheren Handel starten", BG: "Започни сигурна сделка" },
  "hero.howItWorks": { EN: "Explore Workflow", DE: "Workflow erkunden", BG: "Разгледай процеса" },
  
  // Buyer Dashboard & AI
  "buyer.title": { EN: "My Trades", DE: "Meine Trades", BG: "Моите Сделки" },
  "buyer.subtitle": { EN: "Manage your escrow payments and active trades.", DE: "Verwalten Sie Ihre Treuhandzahlungen und aktiven Trades.", BG: "Управлявайте вашите ескроу плащания и преглеждайте активни сделки." },
  "buyer.aiMarket": { EN: "AI Market Intelligence", DE: "AI-Marktintelligenz", BG: "AI Пазарен Анализ" },
  "buyer.aiTrend": { EN: "Price Trend Forecast", DE: "Preisentwicklungsprognose", BG: "Прогноза за Ценови Тренд" },
  "buyer.aiTrendDesc": { EN: "Sunflower oil prices expected to rise +12% in Q4 due to European drought.", DE: "Sonnenblumenölpreise steigen im Q4 voraussichtlich um +12% aufgrund von Dürre in Europa.", BG: "Очаква се цената на слънчогледа да се покачи с +12% през Q4 заради суша в Европа." },
  "buyer.aiCapacity": { EN: "Supplier Capacity", DE: "Lieferantenkapazität", BG: "Капацитет на Доставчици" },
  "buyer.aiCapacityDesc": { EN: "3 Halal-certified suppliers in BG/RO have immediate loading capacity.", DE: "3 Halal-zertifizierte Lieferanten in BG/RO haben sofortige Ladekapazität.", BG: "3 Халал-сертифицирани доставчици в БГ/РО имат наличен капацитет." },
  "buyer.aiAction": { EN: "Strategic Recommendation", DE: "Strategische Empfehlung", BG: "Стратегическа Препоръка" },
  "buyer.aiLock": { EN: "Lock Price Now", DE: "Preis jetzt sichern", BG: "Заключи Цена Сега" },
  "buyer.active": { EN: "Active Trades", DE: "Aktive Trades", BG: "Активни Сделки" },
  "buyer.inEscrow": { EN: "In Escrow", DE: "Im Treuhand", BG: "В Ескроу" },
  "buyer.completed": { EN: "Completed Trades", DE: "Abgeschlossene Trades", BG: "Завършени Сделки" },
  "buyer.waitingDeposit": { EN: "Awaiting Deposit", DE: "Warten auf Einzahlung", BG: "Сделки Чакащи Депозит" },

  // AI Sourcing Layer
  "sourcing.title": { EN: "AI Matching Engine", DE: "AI Matching-Engine", BG: "AI Търсачка за Доставчици" },
  "sourcing.subtitle": { EN: "Find verified suppliers matching your exact requirements.", DE: "Finden Sie verifizierte Lieferanten, die genau Ihren Anforderungen entsprechen.", BG: "Намерете проверени доставчици, отговарящи точно на вашите изисквания." },
  "sourcing.searchPlaceholder": { EN: "e.g. Tomato powder, Halal certified, 12 months shelf life, delivery to Hamad Port", DE: "z.B. Tomatenpulver, Halal-zertifiziert, 12 Monate Haltbarkeit, Lieferung nach Hamad Port", BG: "напр. Домат на прах, Halal сертифициран, доставка до Хамад Порт" },
  "sourcing.searchBtn": { EN: "AI Search", DE: "AI-Suche", BG: "AI Търсене" },
  "sourcing.analyzing": { EN: "Analyzing requirements & scanning EU suppliers...", DE: "Anforderungen analysieren & EU-Lieferanten scannen...", BG: "Анализиране на изискванията и сканиране на EU доставчици..." },
  "sourcing.resultsTitle": { EN: "Top Ranked Suppliers", DE: "Top-bewertete Lieferanten", BG: "Топ Класирани Доставчици" },
  "sourcing.matchScore": { EN: "Match", DE: "Übereinstimmung", BG: "Съвпадение" },
  "sourcing.generateContract": { EN: "Generate Smart Contract", DE: "Smart Contract Generieren", BG: "Създай Смарт Договор" },
  "sourcing.capacity": { EN: "Capacity", DE: "Kapazität", BG: "Капацитет" },
  "sourcing.price": { EN: "Est. Price", DE: "Geschätzter Preis", BG: "Прогн. Цена" },

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
  
  // IoT Telemetry
  "trade.telemetryTitle": { EN: "IoT Telemetry & Logistics", DE: "IoT-Telemetrie & Logistik", BG: "IoT Телеметрия и Логистика" },
  "trade.liveLocation": { EN: "Live Location", DE: "Live-Standort", BG: "Локация на живо" },
  "trade.vesselStatus": { EN: "Vessel Status", DE: "Schiffsstatus", BG: "Статус на кораба" },
  "trade.moistureLevel": { EN: "Moisture Level", DE: "Feuchtigkeitsgehalt", BG: "Ниво на влажност" },
  "trade.moistureDesc": { EN: "Container sensor #482", DE: "Containersensor #482", BG: "Сензор в контейнер #482" },
  "trade.condition": { EN: "Smart Contract Condition", DE: "Smart Contract Bedingung", BG: "Условие на Смарт Договора" },
  "trade.inTransit": { EN: "In Transit (Aegean Sea)", DE: "Unterwegs (Ägäis)", BG: "В транзит (Егейско море)" },
  "trade.eta": { EN: "ETA: 2 Days", DE: "Ankunft: 2 Tage", BG: "Очаква се след 2 дни" },

  // Footer
  "footer.ownedBy": { EN: "Owned and operated by", DE: "Eigentum und Betrieb durch", BG: "Собственост на" },
  "footer.contact": { EN: "Contact", DE: "Kontakt", BG: "Контакти" },

  // Oracle Dashboard
  "oracle.title": { EN: "Independent Inspector (SGS)", DE: "Unabhängiger Inspektor (SGS)", BG: "Независим Инспектор (SGS)" },
  "oracle.subtitle": { EN: "Confirm the physical inspection results and record them in the smart contract.", DE: "Bestätigen Sie die physischen Inspektionsergebnisse und dokumentieren Sie diese im Smart Contract.", BG: "Потвърдете резултатите от физическата инспекция и ги запишете в смарт договора." },
  "oracle.pending": { EN: "Pending Inspections", DE: "Ausstehende Inspektionen", BG: "Чакащи Инспекции" },
  "oracle.actionReq": { EN: "Action Required", DE: "Handlungsbedarf", BG: "Изисква Действие" },
  "oracle.completed": { EN: "Completed", DE: "Abgeschlossen", BG: "Завършени" },
  "oracle.auth": { EN: "Cryptographic Authentication", DE: "Kryptografische Authentifizierung", BG: "Криптографско Удостоверяване" },
  "oracle.measured": { EN: "Measured Moisture", DE: "Gemessene Feuchtigkeit", BG: "Измерена Влажност" },
  "oracle.limit": { EN: "Contract Limit", DE: "Vertragsgrenze", BG: "Лимит по договор" },
  "oracle.proof": { EN: "Proof (IPFS Hash)", DE: "Nachweis (IPFS-Hash)", BG: "Доказателство (IPFS Hash)" },
  "oracle.success": { EN: "Successfully recorded on the blockchain", DE: "Erfolgreich in der Blockchain aufgezeichnet", BG: "Успешно записано в блокчейна" },
  "oracle.approveBtn": { EN: "Approve & Sign Transaction", DE: "Genehmigen & Transaktion signieren", BG: "Одобри & Подпиши Транзакция" },
  "oracle.rejectBtn": { EN: "Reject", DE: "Ablehnen", BG: "Отхвърли" },
  "oracle.processing": { EN: "Signing (MetaMask)...", DE: "Signieren (MetaMask)...", BG: "Подписване (MetaMask)..." },
  "oracle.reqWallet": { EN: "* Requires a connected Web3 wallet to sign the smart contract transaction.", DE: "* Erfordert ein verbundenes Web3-Wallet, um die Smart-Contract-Transaktion zu signieren.", BG: "* Изисква свързан Web3 портфейл за подписване на транзакцията към смарт договора." },

  // Accounting Dashboard
  "acc.title": { EN: "Financial Reports", DE: "Finanzberichte", BG: "Финансови Отчети" },
  "acc.subtitle": { EN: "This panel links crypto transactions with legal entities. Data is cryptographically secured via IPFS, ensuring immutability according to German tax requirements (GoBD).", DE: "Dieses Panel verknüpft Krypto-Transaktionen mit juristischen Personen. Daten sind kryptografisch via IPFS gesichert und garantieren Unveränderlichkeit nach GoBD.", BG: "Този панел обединява крипто транзакциите с реалните юридически лица. Данните са криптографски защитени чрез IPFS хешове, гарантирайки неизменяемост според изискванията на немските данъчни власти (GoBD)." },
  "acc.exportBtn": { EN: "Export for DATEV (CSV)", DE: "Export für DATEV (CSV)", BG: "Експорт за DATEV (CSV)" },
  "acc.generating": { EN: "Generating...", DE: "Wird generiert...", BG: "Генериране..." },
  "acc.vol": { EN: "Total Volume (July)", DE: "Gesamtvolumen (Juli)", BG: "Общ Обем (Юли)" },
  "acc.trades": { EN: "Processed Trades", DE: "Verarbeitete Trades", BG: "Обработени Сделки" },
  "acc.success": { EN: "successful", DE: "erfolgreich", BG: "успешни" },
  "acc.audit": { EN: "Audit Status", DE: "Audit-Status", BG: "Одит статус" },
  "acc.audit1": { EN: "All invoices available", DE: "Alle Rechnungen vorhanden", BG: "Всички фактури налични" },
  "acc.audit2": { EN: "Blockchain signatures match", DE: "Blockchain-Signaturen stimmen überein", BG: "Блокчейн подписите съвпадат" },
  "acc.tableTrade": { EN: "Trade", DE: "Handel", BG: "Сделка" },
  "acc.tableDate": { EN: "Date", DE: "Datum", BG: "Дата" },
  "acc.tableBuyer": { EN: "Buyer (EU-Land u. UStID)", DE: "Käufer (EU-Land u. UStID)", BG: "Купувач (EU-Land u. UStID)" },
  "acc.tableAmount": { EN: "Amount (USDC)", DE: "Betrag (USDC)", BG: "Сума (USDC)" },
  "acc.tableEq": { EN: "Equivalent (EUR)", DE: "Gegenwert (EUR)", BG: "Еквивалент (EUR)" },
  "acc.tableTrail": { EN: "Audit Trail (Tx)", DE: "Prüfpfad (Tx)", BG: "Одит Следа (Tx)" },
  "acc.tableStatus": { EN: "Status", DE: "Status", BG: "Статус" },
  "acc.statusBooked": { EN: "Booked", DE: "Verbucht", BG: "Осчетоводена" },
  "acc.statusPending": { EN: "Awaiting Export", DE: "Wartet auf Export", BG: "Чака Експорт" },

  // Arbitration Dashboard
  "arb.title": { EN: "Arbitration Court", DE: "Schiedsgericht", BG: "Arbitration Court" },
  "arb.login": { EN: "Login as Arbitrator", DE: "Als Schlichter anmelden", BG: "Вход като Арбитър" },
  "arb.panelTitle": { EN: "Dispute Control Panel", DE: "Streitfall-Kontrollpanel", BG: "Контролен Панел за Спорове" },
  "arb.panelDesc": { EN: "Manage frozen escrow contracts and resolve trade conflicts.", DE: "Verwalten Sie eingefrorene Treuhandverträge und lösen Sie Handelskonflikte.", BG: "Управлявайте замразени ескроу договори и решавайте търговски конфликти." },
  "arb.activeDisputes": { EN: "Active Disputes", DE: "Aktive Streitfälle", BG: "Активни Спорове" },
  "arb.disputed": { EN: "Disputed", DE: "Umstritten", BG: "Disputed" },
  "arb.resolved": { EN: "Resolved", DE: "Gelöst", BG: "Resolved" },
  "arb.locked": { EN: "Locked", DE: "Gesperrt", BG: "Заключени" },
  "arb.timeAgo": { EN: "2 hours ago", DE: "Vor 2 Stunden", BG: "Преди 2 часа" },
  "arb.resolvedDesc": { EN: "The dispute has been resolved.", DE: "Der Streitfall wurde gelöst.", BG: "Спорът е разрешен." },
  "arb.invTitle": { EN: "Dispute Investigation #104", DE: "Streitfall-Untersuchung #104", BG: "Разследване на Спор #104" },
  "arb.invDesc": { EN: "The smart contract is temporarily frozen.", DE: "Der Smart Contract ist vorübergehend eingefroren.", BG: "Смарт договорът е временно замразен." },
  "arb.claim": { EN: "Buyer's Claim", DE: "Forderung des Käufers", BG: "Претенция от Купувача" },
  "arb.claimText": { EN: "The shipment arrived at Port Varna, but truck number 3 had a broken seal and high moisture. The SGS certificate was issued before transport, but the goods were damaged by rain during transit. I request a refund.", DE: "Die Sendung kam im Hafen Varna an, aber LKW 3 hatte ein beschädigtes Siegel und hohe Feuchtigkeit. Das SGS-Zertifikat wurde vor dem Transport ausgestellt, aber die Ware wurde während des Transports durch Regen beschädigt. Ich fordere eine Rückerstattung.", BG: "\"Пратката пристигна в Порт Варна, но камион номер 3 беше с нарушена пломба и висока влажност. SGS сертификатът е издаден преди транспортирането, но по време на пътя стоката е била повредена от дъжд. Изисквам възстановяване на средствата.\"" },
  "arb.evidence": { EN: "Evidence", DE: "Beweismittel", BG: "Доказателства" },
  "arb.photo": { EN: "photo_truck3.jpg", DE: "foto_lkw3.jpg", BG: "снимка_камион3.jpg" },
  "arb.certValid": { EN: "Valid at loading", DE: "Gültig bei Verladung", BG: "Валиден при натоварване" },
  "arb.decision": { EN: "Arbitrator's Decision", DE: "Entscheidung des Schlichters", BG: "Решение на Арбитъра" },
  "arb.reqWallet": { EN: "You must login with an Admin Web3 wallet to sign the decision.", DE: "Sie müssen sich mit einem Admin-Web3-Wallet anmelden, um die Entscheidung zu signieren.", BG: "Трябва да влезете с Web3 портфейл на Администратор, за да подпишете решението." },
  "arb.refundBtn": { EN: "Refund Buyer", DE: "Käufer erstatten", BG: "Възстанови на Купувача" },
  "arb.releaseBtn": { EN: "Release to Seller", DE: "An Verkäufer freigeben", BG: "Освободи към Продавача" },
  "arb.select": { EN: "Select a dispute from the list", DE: "Wählen Sie einen Streitfall aus der Liste", BG: "Изберете спор от списъка" },
  "arb.selectDesc": { EN: "The arbitration panel allows viewing evidence and executing blockchain transactions to resolve conflicts.", DE: "Das Schiedspanel ermöglicht die Anzeige von Beweisen und die Ausführung von Blockchain-Transaktionen zur Lösung von Konflikten.", BG: "Арбитражният панел позволява разглеждане на доказателства и изпълнение на блокчейн транзакции за разрешаване на конфликти." },

  // Footer Demo Links
  "demo.title": { EN: "Demo Panels (Roles)", DE: "Demo-Panels (Rollen)", BG: "Демонстрационни Панели (Роли)" },
  "demo.buyer": { EN: "1. Buyer / Seller (Escrow Trade)", DE: "1. Käufer / Verkäufer (Treuhand)", BG: "1. Купувач / Продавач (Ескроу Сделка)" },
  "demo.oracle": { EN: "2. SGS Inspector (Oracle Dashboard)", DE: "2. SGS-Inspektor (Oracle Dashboard)", BG: "2. SGS Инспектор (Oracle Dashboard)" },
  "demo.accounting": { EN: "3. Accounting & GoBD (Admin)", DE: "3. Buchhaltung & GoBD (Admin)", BG: "3. Счетоводство и GoBD (Admin)" },
  "demo.arbitration": { EN: "4. Arbitrator / Dispute Resolution", DE: "4. Schlichter / Streitbeilegung", BG: "4. Арбитър / Разрешаване на спорове" },


  // Landing Page — Nav
  "nav.demo": { EN: "Demo Dashboard", DE: "Demo-Dashboard", BG: "Демо Дашборд" },
  "nav.team": { EN: "Talk to the team", DE: "Mit dem Team sprechen", BG: "Говори с екипа" },

  // Landing Page — Hero
  "hero.badge": {
    EN: "Kontor 21 — AI Trade Assurance Platform",
    DE: "Kontor 21 — AI-Handelssicherungsplattform",
    BG: "Kontor 21 — AI Платформа за Търговска Сигурност"
  },

  // Landing Page — Features
  "features.title": {
    EN: "How does AI Trade Assurance work?",
    DE: "Wie funktioniert AI Trade Assurance?",
    BG: "Как работи AI Търговската Сигурност?"
  },
  "features.subtitle": {
    EN: "We combine verified trade documents, independent inspections, IoT evidence and configurable settlement options.",
    DE: "Wir kombinieren verifizierte Handelsdokumente, unabhängige Inspektionen, IoT-Beweise und konfigurierbare Abwicklungsoptionen.",
    BG: "Обединяваме проверени търговски документи, независими инспекции, IoT доказателства и гъвкави опции за разплащане."
  },
  "features.step1Title": {
    EN: "1. Kontor21 Intelligence",
    DE: "1. Kontor21 Intelligence",
    BG: "1. Kontor21 Intelligence"
  },
  "features.step1Desc": {
    EN: "Verify suppliers, assess risk, and predict price/harvest trends before entering a trade agreement.",
    DE: "Überprüfen Sie Lieferanten, bewerten Sie das Risiko und prognostizieren Sie Preis-/Erntetrends, bevor Sie eine Handelsvereinbarung treffen.",
    BG: "Проверете доставчиците, оценете риска и прогнозирайте ценовите/реколтните тенденции преди сключване на търговско споразумение."
  },
  "features.step2Title": {
    EN: "2. Independent Inspection & Evidence",
    DE: "2. Unabhängige Inspektion & Beweise",
    BG: "2. Независима инспекция и доказателства"
  },
  "features.step2Desc": {
    EN: "Inspection results and IoT evidence are evaluated against predefined contractual rules. (Compatible with independent inspection companies such as SGS, Bureau Veritas or Intertek)",
    DE: "Inspektionsergebnisse und IoT-Beweise werden anhand vordefinierter vertraglicher Regeln bewertet. (Kompatibel mit unabhängigen Inspektionsunternehmen wie SGS, Bureau Veritas oder Intertek)",
    BG: "Резултатите от инспекцията и IoT доказателствата се оценяват спрямо предварително дефинирани договорни правила. (Съвместимо с независими инспекционни компании като SGS, Bureau Veritas или Intertek)"
  },
  "features.step3Title": {
    EN: "3. Flexible Settlement",
    DE: "3. Flexible Abwicklung",
    BG: "3. Гъвкаво Разплащане"
  },
  "features.step3Desc": {
    EN: "Choose your preferred settlement method: Smart Contract Escrow (USDC/USDT), traditional Bank Wire, or Letter of Credit.",
    DE: "Wählen Sie Ihre bevorzugte Abwicklungsmethode: Smart Contract Treuhand (USDC/USDT), klassische Banküberweisung oder Akkreditiv.",
    BG: "Изберете предпочитания метод за разплащане: Ескроу със смарт договор (USDC/USDT), традиционен банков превод или акредитив."
  },


  // Landing Page — Comparison
  "compare.title": {
    EN: "Secure Settlement Options",
    DE: "Sichere Abwicklungsoptionen",
    BG: "Сигурни Опции за Разплащане"
  },
  "compare.subtitle": {
    EN: "Kontor21 reduces dependence on correspondent banking and enables blockchain-based settlement where legally permitted. Our programmable escrow with stablecoins (USDC/USDT) settles instantly upon verification.",
    DE: "Kontor21 reduziert die Abhängigkeit von Korrespondenzbanken und ermöglicht blockchainbasierte Abwicklungen, sofern gesetzlich zulässig. Unser programmierbarer Treuhandservice mit Stablecoins (USDC/USDT) wickelt sofort nach Verifizierung ab.",
    BG: "Kontor21 намалява зависимостта от кореспондентско банкиране и позволява базиран на блокчейн сетълмент, където е законово допустимо. Нашият програмируем ескроу със стейбълкойни (USDC/USDT) извършва моментален сетълмент при потвърждение."
  },
  "compare.benefit1": { EN: "Instant settlement (T+0) via Blockchain", DE: "Sofortige Abwicklung (T+0) via Blockchain", BG: "Моментален сетълмент (T+0) чрез Блокчейн" },
  "compare.benefit2": { EN: "Reduces settlement-period FX exposure for USD-denominated transactions.", DE: "Reduziert FX-Risiken in der Abwicklungsperiode für USD-denominierte Transaktionen.", BG: "Намалява валутния риск (FX) по време на сетълмент за транзакции в USD." },
  "compare.benefit3": { EN: "Works 24/7, programmable automated execution", DE: "Funktioniert 24/7, programmierbare automatisierte Ausführung", BG: "Работи 24/7, програмируемо автоматизирано изпълнение" },
  "compare.traditionalLabel": { EN: "Traditional L/C", DE: "Traditionelles Akkreditiv", BG: "Традиционен Акредитив" },
  "compare.days": { EN: "3-7 Days", DE: "3-7 Tage", BG: "3-7 Дни" },
  "compare.bankFees": { EN: "Bank Fees", DE: "Bankgebühren", BG: "Банкови Такси" },
  "compare.feePercent": { EN: "~2.5% - 6%", DE: "~2,5% - 6%", BG: "~2.5% - 6%" },
  "compare.kontor21": { EN: "Kontor21 Escrow", DE: "Kontor21 Treuhand", BG: "Kontor21 Ескроу" },
  "compare.instant": { EN: "Instant", DE: "Sofort", BG: "Моментално" },
  "compare.feeLow": { EN: "0.25% Platform Fee + Variable Gas", DE: "0,25% Plattformgebühr + Variable Gasgebühr", BG: "0.25% Платформена Такса + Вариативна Мрежова Такса" },

  // Landing Page - Transparency & Trust Center
  "trust.title": { EN: "Transparency & Trust", DE: "Transparenz & Vertrauen", BG: "Прозрачност и Доверие" },
  "trust.contract": { EN: "Smart Contract:", DE: "Smart Contract:", BG: "Смарт Договор:" },
  "trust.network": { EN: "Network:", DE: "Netzwerk:", BG: "Мрежа:" },
  "trust.networkValue": { EN: "Polygon Amoy Testnet", DE: "Polygon Amoy Testnet", BG: "Polygon Amoy Testnet" },
  "trust.status": { EN: "Status:", DE: "Status:", BG: "Статус:" },
  "trust.statusValue": { EN: "Live on Polygon Amoy Testnet", DE: "Live auf Polygon Amoy Testnet", BG: "Активен на Polygon Amoy Testnet" },
  "trust.audit": { EN: "Audit:", DE: "Audit:", BG: "Одит:" },
  "trust.auditValue": { EN: "Contract verified on-chain", DE: "Vertrag auf der Blockchain verifiziert", BG: "Договорът е верифициран в блокчейна" },
  "trust.nav": { EN: "Trust Center", DE: "Trust Center", BG: "Център за Доверие" },
  
  // Evidence Engine
  "evidence.title": { EN: "Evidence Engine", DE: "Beweis-Engine", BG: "Двигател на Доказателствата" },
  "evidence.subtitle": { EN: "Immutable audit trail combining physical, digital, and IoT evidence.", DE: "Unveränderlicher Prüfpfad, der physische, digitale und IoT-Beweise kombiniert.", BG: "Неизменим одиторски запис, съчетаващ физически, дигитални и IoT доказателства." },
  
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

  // Trade History
  "history.title": { EN: "Trade History", DE: "Handelsverlauf", BG: "История на сделките" },
  "history.loading": { EN: "Loading...", DE: "Laden...", BG: "Зареждане..." },
  "history.desc": { EN: "View all your trades across the platform.", DE: "Alle Ihre Handelsgeschäfte auf der Plattform.", BG: "Преглед на всички ваши сделки." },
  "history.all": { EN: "All", DE: "Alle", BG: "Всички" },
  "history.active": { EN: "Active", DE: "Aktiv", BG: "Активни" },
  "history.completed": { EN: "Completed", DE: "Abgeschlossen", BG: "Завършени" },
  "history.disputed": { EN: "Disputed", DE: "Umstritten", BG: "Оспорени" },
  "history.tradeId": { EN: "Trade ID", DE: "Handels-ID", BG: "ID на сделка" },
  "history.product": { EN: "Product", DE: "Produkt", BG: "Продукт" },
  "history.amount": { EN: "Amount", DE: "Betrag", BG: "Сума" },
  "history.status": { EN: "Status", DE: "Status", BG: "Статус" },
  "history.date": { EN: "Date", DE: "Datum", BG: "Дата" },
  "history.actions": { EN: "Actions", DE: "Aktionen", BG: "Действия" },
  "history.noTrades": { EN: "No trades yet", DE: "Noch keine Handelsgeschäfte", BG: "Все още няма сделки" },
  "history.noTradesDesc": { EN: "Your connected wallet has no trade history.", DE: "Ihr verbundenes Wallet hat keine Handelshistorie.", BG: "Свързаният портфейл няма история на сделки." },
  "history.search": { EN: "Search by trade ID...", DE: "Suche nach Handels-ID...", BG: "Търсене по ID на сделка..." },

  // Seller Dashboard
  "seller.title": { EN: "Seller Overview", DE: "Verkäuferübersicht", BG: "Преглед на търговеца" },
  "seller.subtitle": { EN: "Manage your smart contracts and escrow payments.", DE: "Verwalten Sie Ihre Smart Contracts und Treuhandzahlungen.", BG: "Управлявайте вашите смарт договори и ескроу плащания." },
  "seller.newContract": { EN: "New Smart Contract", DE: "Neuer Smart Contract", BG: "Нов Смарт Договор" },
  "seller.totalRevenue": { EN: "Total Revenue", DE: "Gesamtumsatz", BG: "Общ Приход" },
  "seller.inEscrow": { EN: "In Escrow", DE: "Im Treuhand", BG: "В Ескроу" },
  "seller.successfulTrades": { EN: "Successful Trades", DE: "Erfolgreiche Trades", BG: "Успешни Сделки" },
  "seller.activeTrades": { EN: "Active Trades", DE: "Aktive Trades", BG: "Активни Сделки" },
  "seller.searchPlaceholder": { EN: "Search by ID or product...", DE: "Suche nach ID oder Produkt...", BG: "Търси по ID или стока..." },
  "seller.tradeId": { EN: "Trade ID", DE: "Trade ID", BG: "Сделка ID" },
  "seller.product": { EN: "Product", DE: "Produkt", BG: "Стока" },
  "seller.amount": { EN: "Amount (USDC)", DE: "Betrag (USDC)", BG: "Сума (USDC)" },
  "seller.status": { EN: "Status", DE: "Status", BG: "Статус" },
  "seller.oracles": { EN: "Oracles", DE: "Orakel", BG: "Оракули" },
  "seller.action": { EN: "Action", DE: "Aktion", BG: "Действие" },
  "seller.withdraw": { EN: "Withdraw", DE: "Abheben", BG: "Изтегли (Withdraw)" },
  "seller.statusFunded": { EN: "Funded (Locked)", DE: "Finanziert (Gesperrt)", BG: "Депозирано (Заключено)" },
  "seller.statusAwaiting": { EN: "Awaiting Deposit", DE: "Wartet auf Einzahlung", BG: "Чака депозит" },
  "seller.uploadInvoice": { EN: "Upload Invoice", DE: "Rechnung hochladen", BG: "Качи фактура" },
  "seller.enterBatch": { EN: "Enter Batch Details", DE: "Chargendetails eingeben", BG: "Въведи детайли за партидата" },
  "seller.awaitingLoading": { EN: "Awaiting Loading", DE: "Wartet auf Verladung", BG: "В очакване на натоварване" },
  "seller.uploadSuccess": { EN: "Invoice Uploaded", DE: "Rechnung hochgeladen", BG: "Фактурата е качена" },
  "seller.batchSuccess": { EN: "Batch Data Saved", DE: "Chargendaten gespeichert", BG: "Данните за партидата са записани" },

  // Settings
  "settings.title": { EN: "Settings", DE: "Einstellungen", BG: "Настройки" },
  "settings.desc": { EN: "Manage your account preferences.", DE: "Verwalten Sie Ihre Kontoeinstellungen.", BG: "Управление на предпочитанията." },
  "settings.wallet": { EN: "Wallet", DE: "Wallet", BG: "Портфейл" },
  "settings.walletDesc": { EN: "Your connected wallet address.", DE: "Ihre verbundene Wallet-Adresse.", BG: "Адрес на свързания портфейл." },
  "settings.language": { EN: "Language", DE: "Sprache", BG: "Език" },
  "settings.languageDesc": { EN: "Choose your preferred language.", DE: "Wählen Sie Ihre bevorzugte Sprache.", BG: "Изберете предпочитан език." },
  "settings.notifPref": { EN: "Notification Preferences", DE: "Benachrichtigungseinstellungen", BG: "Предпочитания за известия" },
  "settings.notifDesc": { EN: "Choose which updates you receive.", DE: "Wählen Sie, welche Updates Sie erhalten.", BG: "Изберете какви обновления да получавате." },
  "settings.emailNotif": { EN: "Email Notifications", DE: "E-Mail-Benachrichtigungen", BG: "Имейл известия" },
  "settings.pushNotif": { EN: "Push Notifications", DE: "Push-Benachrichtigungen", BG: "Push известия" },

  // AI Mission Control Notifications
  "notif.title": { EN: "AI Mission Control", DE: "AI-Missionskontrolle", BG: "AI Контролен Център" },
  "notif.empty": { EN: "No AI events yet", DE: "Noch keine AI-Ereignisse", BG: "Няма AI събития все още" },
  "notif.emptyDesc": { EN: "Automated communication logs will appear here.", DE: "Automatisierte Kommunikationsprotokolle werden hier angezeigt.", BG: "Автоматизираните комуникационни логове ще се появят тук." },
  "notif.markAll": { EN: "Mark all verified", DE: "Alle als verifiziert markieren", BG: "Отбележи всички като прочетени" },
  "notif.created": { EN: "Smart Contract Deployed", DE: "Smart Contract Bereitgestellt", BG: "Смарт Договорът е Деплойнат" },
  "notif.funded": { EN: "Funds Locked in Escrow", DE: "Gelder im Treuhandkonto gesperrt", BG: "Средствата са Заключени в Ескроу" },
  "notif.approved": { EN: "AI Verified Certificate", DE: "AI Verifiziertes Zertifikat", BG: "AI Верифицира Сертификат" },
  "notif.disputed": { EN: "IoT Sensor Alert", DE: "IoT-Sensor Warnung", BG: "IoT Сензор Предупреждение" },
  "notif.resolved": { EN: "Dispute Automatically Resolved", DE: "Streitfall automatisch gelöst", BG: "Диспутът е Автоматично Решен" },
  "notif.desc.created": { EN: "Trade escrow contract initialized on the blockchain.", DE: "Treuhandvertrag auf der Blockchain initialisiert.", BG: "Ескроу договор е създаден в блокчейна." },
  "notif.desc.funded": { EN: "Funds successfully locked. Smart contract active.", DE: "Gelder erfolgreich gesperrt. Smart Contract aktiv.", BG: "Средствата са успешно заключени. Смарт договорът е активен." },
  "notif.desc.approved": { EN: "AI verified Halal Certificate (Hash: 0x98f...). Authenticity confirmed.", DE: "AI hat Halal-Zertifikat verifiziert (Hash: 0x98f...). Echtheit bestätigt.", BG: "AI верифицира Halal сертификат (Hash: 0x98f...). Автентичността е потвърдена." },
  "notif.desc.disputed": { EN: "Humidity sensor spiked to 16.5% (> 15% limit). Escrow payments halted.", DE: "Feuchtigkeitssensor stieg auf 16,5% (> 15% Limit). Treuhandzahlungen gestoppt.", BG: "Сензор за влажност отчете 16.5% (> 15% лимит). Ескроу плащанията са спрени." },
  "notif.desc.resolved": { EN: "Oracle confirmed acceptable cargo condition. Escrow released.", DE: "Orakel bestätigte akzeptablen Ladungszustand. Treuhandkonto freigegeben.", BG: "Оракулът потвърди приемливо състояние на товара. Средствата са освободени." },

  // Onboarding and safe interactive demo
  "onboarding.close": { EN: "Close onboarding", DE: "Einführung schließen", BG: "Затвори представянето" },
  "onboarding.step": { EN: "Step", DE: "Schritt", BG: "Стъпка" },
  "onboarding.next": { EN: "Continue", DE: "Weiter", BG: "Продължи" },
  "onboarding.openDemo": { EN: "Open safe demo", DE: "Sichere Demo öffnen", BG: "Отвори безопасното демо" },
  "onboarding.restartTour": { EN: "Product tour", DE: "Produkttour", BG: "Продуктова обиколка" },
  "onboarding.welcomeTitle": { EN: "Welcome to Kontor 21", DE: "Willkommen bei Kontor 21", BG: "Добре дошли в Kontor 21" },
  "onboarding.welcomeDesc": { EN: "A single workflow for verified agricultural trade, escrow settlement, evidence, and arbitration.", DE: "Ein gemeinsamer Workflow für verifizierten Agrarhandel, Treuhandabwicklung, Nachweise und Schlichtung.", BG: "Единен процес за проверена агро търговия, ескроу разплащане, доказателства и арбитраж." },
  "onboarding.workflowTitle": { EN: "Every participant has a clear role", DE: "Jeder Teilnehmer hat eine klare Rolle", BG: "Всеки участник има ясна роля" },
  "onboarding.workflowDesc": { EN: "The seller creates the trade, the buyer funds it, approved inspectors submit evidence, and the oracle releases funds when conditions are met.", DE: "Der Verkäufer erstellt den Handel, der Käufer finanziert ihn, zugelassene Prüfer reichen Nachweise ein und das Orakel gibt die Mittel frei.", BG: "Продавачът създава сделката, купувачът я финансира, одобрени инспектори подават доказателства, а оракулът освобождава средствата." },
  "onboarding.demoTitle": { EN: "Explore without a wallet", DE: "Ohne Wallet erkunden", BG: "Разгледайте без портфейл" },
  "onboarding.demoDesc": { EN: "The interactive demo uses sample data only. It never requests a signature and cannot move funds.", DE: "Die interaktive Demo verwendet nur Beispieldaten. Sie fordert keine Signatur an und kann keine Gelder bewegen.", BG: "Интерактивното демо използва само примерни данни. То не изисква подпис и не може да премества средства." },
  "demo.safeLabel": { EN: "SAFE DEMO · NO FUNDS", DE: "SICHERE DEMO · KEINE GELDER", BG: "БЕЗОПАСНО ДЕМО · БЕЗ СРЕДСТВА" },
  "demo.back": { EN: "Back to home", DE: "Zurück zur Startseite", BG: "Обратно към началото" },
  "demo.interactive": { EN: "Interactive product tour", DE: "Interaktive Produkttour", BG: "Интерактивна продуктова обиколка" },
  "demo.workflowTitle": { EN: "Follow a secure trade from agreement to settlement", DE: "Verfolgen Sie einen sicheren Handel von der Vereinbarung bis zur Abwicklung", BG: "Проследете сигурна сделка от договарянето до разплащането" },
  "demo.workflowDesc": { EN: "Select a stage to see who acts, what is verified, and when escrow funds can move.", DE: "Wählen Sie eine Phase, um zu sehen, wer handelt, was geprüft wird und wann Treuhandmittel bewegt werden können.", BG: "Изберете етап, за да видите кой действа, какво се проверява и кога ескроу средствата могат да бъдат освободени." },
  "demo.sampleTrade": { EN: "Sample trade", DE: "Beispielhandel", BG: "Примерна сделка" },
  "demo.currentStage": { EN: "Current stage", DE: "Aktuelle Phase", BG: "Текущ етап" },
  "demo.value": { EN: "Escrow value", DE: "Treuhandwert", BG: "Стойност в ескроу" },
  "demo.network": { EN: "Network", DE: "Netzwerk", BG: "Мрежа" },
  "demo.buyerRole": { EN: "Buyer", DE: "Käufer", BG: "Купувач" },
  "demo.sellerRole": { EN: "Seller", DE: "Verkäufer", BG: "Продавач" },
  "demo.nextStage": { EN: "Next stage", DE: "Nächste Phase", BG: "Следващ етап" },
  "demo.restart": { EN: "Restart", DE: "Neu starten", BG: "Отначало" },
  "demo.noWallet": { EN: "This tour never connects to a wallet, signs transactions, or uses real funds.", DE: "Diese Tour verbindet kein Wallet, signiert keine Transaktionen und verwendet keine echten Gelder.", BG: "Тази обиколка не свързва портфейл, не подписва транзакции и не използва реални средства." },
  "demo.stage.created.title": { EN: "Trade agreement created", DE: "Handelsvereinbarung erstellt", BG: "Създадено търговско споразумение" },
  "demo.stage.created.short": { EN: "Seller defines parties, price, product, and release conditions.", DE: "Der Verkäufer definiert Parteien, Preis, Produkt und Freigabebedingungen.", BG: "Продавачът определя страните, цената, продукта и условията." },
  "demo.stage.created.desc": { EN: "The seller prepares structured trade terms. Both wallet identities and every required inspection condition are recorded before funds are requested.", DE: "Der Verkäufer bereitet strukturierte Handelsbedingungen vor. Wallet-Identitäten und Prüfbedingungen werden vor der Finanzierung erfasst.", BG: "Продавачът подготвя структурирани условия. Портфейлите и всички изисквания за инспекция се записват преди финансирането." },
  "demo.stage.funded.title": { EN: "Buyer funds escrow", DE: "Käufer finanziert Treuhand", BG: "Купувачът финансира ескроу" },
  "demo.stage.funded.short": { EN: "USDC is locked in the smart contract.", DE: "USDC wird im Smart Contract gesperrt.", BG: "USDC се заключва в смарт договора." },
  "demo.stage.funded.desc": { EN: "The buyer approves the exact amount and funds the contract. Neither party can withdraw it unilaterally while the trade is active.", DE: "Der Käufer genehmigt den exakten Betrag und finanziert den Vertrag. Keine Partei kann ihn einseitig abheben.", BG: "Купувачът одобрява точната сума и финансира договора. Никоя страна не може едностранно да я изтегли." },
  "demo.stage.evidence.title": { EN: "Inspection evidence uploaded", DE: "Prüfnachweis hochgeladen", BG: "Качено доказателство от инспекция" },
  "demo.stage.evidence.short": { EN: "Approved provider pins a signed report to IPFS.", DE: "Ein zugelassener Anbieter speichert einen signierten Bericht auf IPFS.", BG: "Одобрен доставчик записва подписан доклад в IPFS." },
  "demo.stage.evidence.desc": { EN: "The approved laboratory or inspector uploads the report. Kontor 21 stores its IPFS CID, measured value, provider wallet, and audit event.", DE: "Labor oder Prüfer lädt den Bericht hoch. Kontor 21 speichert IPFS-CID, Messwert, Anbieter-Wallet und Audit-Ereignis.", BG: "Одобрената лаборатория или инспектор качва доклада. Kontor 21 записва IPFS CID, измерената стойност, портфейла и одитното събитие." },
  "demo.stage.verified.title": { EN: "Conditions verified", DE: "Bedingungen verifiziert", BG: "Условията са потвърдени" },
  "demo.stage.verified.short": { EN: "Rules compare evidence with the agreed limits.", DE: "Regeln vergleichen Nachweise mit den vereinbarten Grenzwerten.", BG: "Правилата сравняват доказателствата с договорените граници." },
  "demo.stage.verified.desc": { EN: "The rules engine evaluates each required condition. Funds remain locked unless every mandatory condition has valid evidence.", DE: "Die Regel-Engine bewertet jede Pflichtbedingung. Gelder bleiben gesperrt, bis alle Nachweise gültig sind.", BG: "Системата оценява всяко задължително условие. Средствата остават заключени, докато всички изисквания нямат валидни доказателства." },
  "demo.stage.released.title": { EN: "Settlement released", DE: "Abwicklung freigegeben", BG: "Разплащането е освободено" },
  "demo.stage.released.short": { EN: "Seller receives payment and the audit trail remains available.", DE: "Der Verkäufer erhält die Zahlung und der Audit-Pfad bleibt verfügbar.", BG: "Продавачът получава плащането, а одитната следа остава достъпна." },
  "demo.stage.released.desc": { EN: "After oracle approval, the smart contract transfers the net payment to the seller and the platform fee to the treasury.", DE: "Nach Orakel-Freigabe überträgt der Smart Contract die Nettozahlung an den Verkäufer und die Gebühr an die Treasury.", BG: "След одобрение от оракула смарт договорът превежда нетното плащане на продавача и таксата към трежърито." },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kontor_lang') as Language;
      if (saved === 'EN' || saved === 'DE' || saved === 'BG') return saved;
    }
    return 'EN';
  });

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
