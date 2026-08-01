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
    EN: "Cross-border bank transfers cost 6.3% in fees and take up to 7 days, leaving you vulnerable to geopolitical crises and currency fluctuations. Our programmable escrow with stablecoins (USDC/USDT) bypasses the banking system entirely—securing funds mathematically and settling instantly upon Oracle confirmation.",
    DE: "Grenzüberschreitende Banküberweisungen kosten 6,3% Gebühren und dauern bis zu 7 Tage, was Sie geopolitischen Krisen und Währungsschwankungen aussetzt. Unser programmierbarer Treuhandservice mit Stablecoins (USDC/USDT) umgeht das Bankensystem vollständig – sichert Gelder mathematisch und wickelt sofort nach Oracle-Bestätigung ab.",
    BG: "Трансграничните банкови преводи струват 6.3% в такси и отнемат до 7 дни, излагайки ви на геополитически рискове и валутни колебания. Нашият програмируем ескроу със стейбълкойни (USDC/USDT) заобикаля банковата система изцяло – осигурява средствата математически и прави моментален сетълмент при одобрение от Оракул."
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

  // Trade History
  "history.title": { EN: "Trade History", DE: "Handelsverlauf", BG: "История на сделките" },
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

  // Notifications
  "notif.title": { EN: "Notifications", DE: "Benachrichtigungen", BG: "Известия" },
  "notif.empty": { EN: "No notifications yet", DE: "Noch keine Benachrichtigungen", BG: "Все още няма известия" },
  "notif.emptyDesc": { EN: "You'll see trade updates here.", DE: "Sie sehen hier Handelsupdates.", BG: "Тук ще виждате обновления за сделките." },
  "notif.markAll": { EN: "Mark all as read", DE: "Alle als gelesen markieren", BG: "Маркирай всички като прочетени" },
  "notif.created": { EN: "New trade created", DE: "Neuer Handel erstellt", BG: "Нова сделка създадена" },
  "notif.funded": { EN: "Trade funded", DE: "Handel finanziert", BG: "Сделката е финансирана" },
  "notif.approved": { EN: "Trade approved by oracle", DE: "Handel vom Orakel genehmigt", BG: "Сделката е одобрена от оракул" },
  "notif.disputed": { EN: "Dispute raised on trade", DE: "Streitfall für Handel eröffnet", BG: "Спор по сделката" },
  "notif.resolved": { EN: "Dispute resolved", DE: "Streitfall gelöst", BG: "Спорът е разрешен" },

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
