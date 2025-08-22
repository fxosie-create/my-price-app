import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ronin Price Widgets – Dashboard",
  // ここがポイント：ダッシュボード配下は専用manifestを使う
  manifest: "/dashboard/manifest.json",
};
