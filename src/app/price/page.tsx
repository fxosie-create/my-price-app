"use client";

import { useEffect, useRef, useState } from "react";

type PriceResp = {
  coinUsd: number;        // USD/COIN
  wronPerCoin: number;    // WRON/COIN
  updatedAt: string;
  error?: string;
};

type Trend = "up" | "down" | "flat";

export default function PricePage() {
  const [data, setData] = useState<PriceResp | null>(null);
  const [usdTrend, setUsdTrend] = useState<Trend>("flat");
  const [wronTrend, setWronTrend] = useState<Trend>("flat");

  const prevUsdRef = useRef<number | undefined>(undefined);
  const prevWronRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<number | null>(null);

  const fetchPrice = async () => {
    try {
      const r = await fetch("/api/gt-price", { cache: "no-store" });
      const j: PriceResp = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      if (prevUsdRef.current !== undefined) {
        setUsdTrend(j.coinUsd > prevUsdRef.current ? "up" : j.coinUsd < prevUsdRef.current ? "down" : "flat");
      }
      if (prevWronRef.current !== undefined) {
        setWronTrend(j.wronPerCoin > prevWronRef.current ? "up" : j.wronPerCoin < prevWronRef.current ? "down" : "flat");
      }

      setData(j);
      prevUsdRef.current = j.coinUsd;
      prevWronRef.current = j.wronPerCoin;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrice();
    timerRef.current = window.setInterval(fetchPrice, 60 * 1000); // 1分
    const kick = window.setTimeout(fetchPrice, 5000);
    const onFocus = () => fetchPrice();
    window.addEventListener("visibilitychange", onFocus);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.clearTimeout(kick);
      window.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const usdText =
    data ? `$${data.coinUsd.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}` : "—";
  const wronText =
    data ? `${data.wronPerCoin.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })} WRON` : "—";

  const arrow = (t: Trend) => (t === "up" ? "↑" : t === "down" ? "↓" : "→");
  const color = (t: Trend) => (t === "up" ? "#22c55e" : t === "down" ? "#ef4444" : "#9ca3af");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0d13",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 18, marginBottom: 12 }}>COIN / WRON · GeckoTerminal</h1>

        <div style={{ display: "grid", gap: 12, minWidth: 320 }}>
          <div style={{ padding: 16, borderRadius: 12, background: "#121523", boxShadow: "0 0 0 1px #21263a inset" }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>COIN price (USD)</div>
            <div style={{ fontSize: 36, fontWeight: 800, display: "flex", gap: 10, justifyContent: "center" }}>
              <span style={{ color: color(usdTrend) }}>{arrow(usdTrend)}</span>
              <span>{usdText}</span>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 12, background: "#121523", boxShadow: "0 0 0 1px #21263a inset" }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>COIN price (WRON per COIN)</div>
            <div style={{ fontSize: 32, fontWeight: 700, display: "flex", gap: 10, justifyContent: "center" }}>
              <span style={{ color: color(wronTrend) }}>{arrow(wronTrend)}</span>
              <span>{wronText}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>
          Updated: {data ? new Date(data.updatedAt).toLocaleString() : "—"} · refresh every 1 min
        </div>
      </div>
    </main>
  );
}
