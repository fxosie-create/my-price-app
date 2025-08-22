import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "COIN widget",
  icons: {
    icon: "/icon-192.png",       // favicon 代わり
    shortcut: "/icon-192.png",   // ショートカット用
    apple: "/icon-192.png",      // iOS ホーム画面用
  },
};

export default function WidgetLayout({ children }: { children: ReactNode }) {
  // /widget 以下専用の薄いラッパー
  return <div style={{ margin: 0, background: "transparent" }}>{children}</div>;
}
