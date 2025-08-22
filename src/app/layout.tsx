import type { Metadata } from "next";
// …既存importはそのまま

export const metadata: Metadata = {
  title: "Ronin Price Widgets",
  description: "COIN / RICE / RONKE monitor",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
  icons: {
    // ← PNGをfaviconとしても使う
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};
