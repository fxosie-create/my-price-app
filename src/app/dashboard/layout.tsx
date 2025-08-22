import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ronin Price Widgets – Dashboard",
  // /dashboard 用の PWA マニフェスト（B案）
  manifest: "/dashboard/manifest.json",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ネストレイアウトは <html> や <body> を返さない
  return <>{children}</>;
}
