// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

// ここで <meta name="google-adsense-account"> も出力します
export const metadata: Metadata = {
  title: "Ronin Price Widgets",
  description: "COIN / RICE / RONKE monitor",
  // ← この other を追加すると <head> に meta が入ります
  other: {
    "google-adsense-account": "ca-pub-7486115105644729",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ AdSense 確認用スクリプト（全ページの <head> に入る） */}
        <Script
          id="adsense-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7486115105644729"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
