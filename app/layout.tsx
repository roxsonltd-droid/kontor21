import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kontor 21 — AI Trade Assurance Platform",
  description: "One trusted workflow from supplier verification to delivery and settlement for secure cross-border agri-trade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-semibold py-1.5 px-4 text-center z-50">
          Demonstration environment — no real funds or commercial transactions.
        </div>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
