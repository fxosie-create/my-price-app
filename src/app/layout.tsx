// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";  // ← 追加
import "./globals.css";

export const metadata: Metadata = {
  title: "Ronin Price Widgets",
  description: "COIN / RICE / RONKE monitor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ AdSense 確認コード */}
        <Script
          id="adsense-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7486115105644729"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
