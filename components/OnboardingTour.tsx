"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Blocks, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "kontor21_onboarding_complete";

export default function OnboardingTour() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const forceOpen = new URLSearchParams(window.location.search).get("onboarding") === "1";
    setOpen(forceOpen || localStorage.getItem(STORAGE_KEY) !== "1");
    const reopen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("kontor21:open-onboarding", reopen);
    return () => window.removeEventListener("kontor21:open-onboarding", reopen);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  const steps = [
    {
      icon: Blocks,
      title: t("onboarding.welcomeTitle"),
      description: t("onboarding.welcomeDesc"),
    },
    {
      icon: ShieldCheck,
      title: t("onboarding.workflowTitle"),
      description: t("onboarding.workflowDesc"),
    },
    {
      icon: CheckCircle2,
      title: t("onboarding.demoTitle"),
      description: t("onboarding.demoDesc"),
    },
  ];
  const current = steps[step];
  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"
          aria-label={t("onboarding.close")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          {t("onboarding.step")} {step + 1} / {steps.length}
        </p>
        <h2 id="onboarding-title" className="pr-8 text-2xl font-bold text-white">
          {current.title}
        </h2>
        <p className="mt-3 leading-relaxed text-zinc-400">{current.description}</p>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex gap-2" aria-hidden="true">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === step ? "w-8 bg-blue-500" : "w-2 bg-zinc-700"
                }`}
              />
            ))}
          </div>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {t("onboarding.next")} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/demo"
              onClick={close}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {t("onboarding.openDemo")} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
