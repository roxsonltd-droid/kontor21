"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  CheckCircle2,
  FileCheck2,
  FlaskConical,
  PackageCheck,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const stages = [
  { key: "created", icon: Blocks, color: "blue" },
  { key: "funded", icon: Wallet, color: "purple" },
  { key: "evidence", icon: FileCheck2, color: "amber" },
  { key: "verified", icon: FlaskConical, color: "emerald" },
  { key: "released", icon: PackageCheck, color: "green" },
] as const;

const colors = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  green: "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function DemoPage() {
  const { t } = useLanguage();
  const [stage, setStage] = useState(0);
  const current = stages[stage];
  const CurrentIcon = current.icon;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <Blocks className="h-5 w-5 text-blue-500" />
            Kontor 21
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 sm:block">
              {t("demo.safeLabel")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("demo.back")}
        </Link>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              {t("demo.interactive")}
            </p>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {t("demo.workflowTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              {t("demo.workflowDesc")}
            </p>

            <div className="mt-8 space-y-3">
              {stages.map((item, index) => {
                const Icon = item.icon;
                const active = index === stage;
                const complete = index < stage;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStage(index)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      active
                        ? colors[item.color]
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      complete ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900/70"
                    }`}>
                      {complete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">
                        {index + 1}. {t(`demo.stage.${item.key}.title`)}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed opacity-80 sm:text-sm">
                        {t(`demo.stage.${item.key}.short`)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-2xl">
              <div className="border-b border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500">{t("demo.sampleTrade")}</p>
                    <h2 className="mt-1 font-semibold text-white">Sunflower Oil · 50 t</h2>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-mono text-blue-400">
                    #K21-DEMO
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border ${colors[current.color]}`}>
                  <CurrentIcon className="h-7 w-7" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {t("demo.currentStage")}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {t(`demo.stage.${current.key}.title`)}
                </h3>
                <p className="mt-3 min-h-20 leading-relaxed text-zinc-400">
                  {t(`demo.stage.${current.key}.desc`)}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-3">
                  <DemoStat label={t("demo.value")} value="41,000 USDC" />
                  <DemoStat label={t("demo.network")} value="Polygon Amoy" />
                  <DemoStat label={t("demo.buyerRole")} value="Agri Import GmbH" />
                  <DemoStat label={t("demo.sellerRole")} value="Agri Nexus Ltd" />
                </dl>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStage((value) => Math.min(value + 1, stages.length - 1))}
                    disabled={stage === stages.length - 1}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("demo.nextStage")} <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage(0)}
                    className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    {t("demo.restart")}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <p>{t("demo.noWallet")}</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function DemoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</dt>
      <dd className="mt-1 truncate text-xs font-medium text-zinc-300 sm:text-sm">{value}</dd>
    </div>
  );
}
