import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { signedFetch } from '@/lib/signedFetch';

type EvidenceItem = {
  id: string;
  documentHash: string;
  providerWallet: string;
  verifiedValue?: string | null;
  validationStatus: "PENDING" | "VALID" | "INVALID" | "CONFLICTING" | "EXPIRED" | "REVOKED" | "MANUAL_REVIEW";
  createdAt: string;
};

interface EvidenceListProps {
  tradeId: string;
}

export default function EvidenceList({ tradeId }: EvidenceListProps) {
  const { t } = useLanguage();
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const gateway = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs").replace(/\/$/, "");

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const res = await signedFetch(`/api/escrow/${encodeURIComponent(tradeId)}/evidence`, {
          cache: 'no-store',
        });
        const data = await res.json();
        setEvidence(data.evidence ?? []);
      } catch (e) {
        console.error('Failed to load evidence', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [tradeId]);

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">{t('trade.evidenceLoading')}</h2>
        <p className="text-zinc-400">{t('trade.loading')}</p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">{t('trade.evidence')}</h2>
      {evidence.length === 0 ? (
        <p className="text-zinc-500">{t('trade.noEvidence')}</p>
      ) : (
        <ul className="space-y-3">
          {evidence.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {e.documentHash.slice(0, 12)}...{e.documentHash.slice(-6)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t('trade.uploadedBy')}: {e.providerWallet.slice(0, 6)}...{e.providerWallet.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {e.validationStatus === "VALID" && (
                  <span className="text-emerald-400 text-sm font-medium">{t('trade.valid')}</span>
                )}
                <a
                  href={`${gateway}/${e.documentHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
