import React from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const certificates = [
  {
    id: 'sgs-1',
    title: 'SGS Certificate of Quality',
    thumbnail: '/certificates/sgs-placeholder.png',
    file: '/certificates/sgs-placeholder.pdf',
    status: 'pending', // could be 'pending' | 'verified'
  },
  // Add more placeholders as needed
];

export default function CertificateGallery() {
  const { t } = useLanguage();
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">{t('trade.certificates')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className={`flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 ${cert.status === 'verified' ? 'opacity-100' : 'opacity-50'}`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-white">{cert.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{cert.status === 'verified' ? t('trade.certVerified') : t('trade.certPending')}</p>
              </div>
            </div>
            <a
              href={cert.file}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
