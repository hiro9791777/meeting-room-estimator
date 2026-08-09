import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Meeting Room Estimator",
  description: "貸し会議室の料金をかんたんに見積もります。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <a
          className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white transition focus:translate-y-0"
          href="#main-content"
        >
          メインコンテンツへ移動
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
