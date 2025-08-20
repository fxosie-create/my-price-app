"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type PriceResp = {
  coinUsd: number;       // USD per COIN
  wronPerCoin: number;   // WRON per COIN
  updatedAt: string;
  error?: string;
};

type Trend = "up" | "down" | "flat";

function Arrow({ t }: { t: Trend }) {
  const color = t === "up" ? "#16a34a" : t === "down" ? "#dc2626" : "#9ca3af";
  const glyph = t === "up" ? "↑" : t === "down" ? "↓" : "→";
  return <span style={{ color, fontWeight: 700, marginRight: 6 }}>{glyph}</span>;
}

/** Suspense で包む外側コンポーネント（ルール対応） */
export default function WidgetPage() {
  return (
    <Suspense fallback={<div style={{ padding: 12, color: "#9ca3af" }}>Loading…</div>}>
      <WidgetInner />
    </Suspense>
  );
}

/** 実本体（ここで useSearchParams を使う） */
function WidgetInner() {
  const [data, setData] = useState<PriceResp | null>(null);
  const [usdTrend, setUsdTrend] = useState<Trend>("flat");
  const [wronTrend, setWronTrend] = useState<Trend>("flat");

  const prevUsd = useRef<number | null>(null);
  const prevWron = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);

  // URLクエリでサイズ調整： /widget?s=sm|md|lg&scale=1.2
  const sp = useSearchParams();
  const size = (sp.get("s") ?? "sm").toLowerCase(); // sm | md | lg
  const scale = Number(sp.get("scale") ?? "1");
  const fontBase = size === "lg" ? 22 : size === "md" ? 18 : 16;
  const scaleSafe = Number.isFinite(scale) ? scale : 1;

  const fetchPrice = async () => {
    try {
      const r = await fetch("/api/gt-price", { cache: "no-store" });
      const j: PriceResp = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      if (prevUsd.current !== null) {
        setUsdTrend(j.coinUsd > prevUsd.current ? "up" : j.coinUsd < prevUsd.current ? "down" : "flat");
      }
      if (prevWron.current !== null) {
        setWronTrend(j.wronPerCoin > prevWron.current ? "up" : j.wronPerCoin < prevWron.current ? "down" : "flat");
      }

      setData(j);
      prevUsd.current = j.coinUsd;
      prevWron.current = j.wronPerCoin;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrice();
    timerId.current = window.setInterval(fetchPrice, 60 * 1000); // 1分ごと
    return () => {
      if (timerId.current) window.clearInterval(timerId.current);
    };
  }, []);

  const usdText =
    data ? `$${data.coinUsd.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}` : "—";
  const wronText =
    data ? `${data.wronPerCoin.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} WRON` : "—";

  // 閾値：0.0007超 or 0.0005未満で赤文字
  const alertWRON =
    data && (data.wronPerCoin > 0.0007 || data.wronPerCoin < 0.0005);

  return (
    <div
      style={{
        transform: `scale(${scaleSafe})`,
        transformOrigin: "top left",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        background: "rgba(11,13,19,0.85)",
        color: "#fff",
        borderRadius: 12,
        border: "1px solid #202437",
        padding: 10,
        width: 280,
      }}
    >
      <div style={{ fontSize: fontBase, opacity: 0.85, marginBottom: 6 }}>COIN / WRON</div>

      {/* USD 行 */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#121523", borderRadius: 10, padding: "8px 10px", marginBottom: 6
        }}
      >
        <div style={{ fontSize: fontBase - 2, opacity: 0.7 }}>USD</div>
        <div style={{ fontSize: fontBase + 6, fontWeight: 800, display: "flex", alignItems: "center" }}>
          <Arrow t={usdTrend} />
          {usdText}
        </div>
      </div>

      {/* WRON 行 */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#121523", borderRadius: 10, padding: "8px 10px"
        }}
      >
        <div style={{ fontSize: fontBase - 2, opacity: 0.7, lineHeight: 1.1 }}>
          WRON /<br /> COIN
        </div>
        <div
          style={{
            fontSize: fontBase + 4,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            color: alertWRON ? "red" : "white",
          }}
        >
          <Arrow t={wronTrend} />
          {wronText}
        </div>
      </div>

      <div style={{ fontSize: 10, opacity: 0.55, marginTop: 6 }}>
        Updated: {data ? new Date(data.updatedAt).toLocaleTimeString() : "—"} · 1m
      </div>
    </div>
  );
}
