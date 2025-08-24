"use client";
import React, { useEffect, useMemo, useState } from "react";

const NETWORK = "ronin";
const API = (poolId) =>
  `https://api.geckoterminal.com/api/v2/networks/${NETWORK}/pools/${poolId}`;

// ★ RICE・RONKE のプールIDを入れてください
//   GeckoTerminalで該当プールを開き、URLの /pools/ の後ろをコピペ
const POOLS = [
  {
    id: "0xda021b3d91f82bf2bcfc1a8709545c3a643d47de", // COIN / WRON
    label: "COIN / WRON",
    note: "CraftWorld COIN プール",
  },
  {
    id: "0x93171ecace2f6b8be8dd09539f55fabe7f805af1", // RICE / Ronke
    label: "RICE / Ronke (Katana V3)",
    note: "Ronke Rice Farmers",
  },
  {
    id: "0x75ae353997242927c701d4d6c2722ebef43fd2d3", // RONKE / WRON
    label: "RONKE / WRON (Katana)",
    note: "Ronke Token",
  },
  {
    id: "0x2ecb08f87f075b5769fe543d0e52e40140575ea7", // RON / USDC
    label: "RON / USDC (Katana V3)",
    note: "Ronin Stable Pool",
  },
];



function usePool(poolId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API(poolId), {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Upstream ${res.status}`);
        const json = await res.json();
        if (isMounted) setData(json?.data?.attributes ?? null);
      } catch (e) {
        if (isMounted) setError(e.message || String(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    const t = setInterval(fetchData, 30_000);
    return () => {
      isMounted = false;
      clearInterval(t);
    };
  }, [poolId]);

  const parsed = useMemo(() => {
  if (!data) return null;

  // 価格（どれかに入っている）
  const priceUsd = Number(
    data?.base_token_price_usd ??
      data?.price_usd ??
      data?.quote_token_price_usd ??
      0
  );

  // 24h変化率：エンドポイントによりキーが違うのでフォールバックで吸収
  const pc24h = (() => {
    const pick = (v) => (v == null ? null : parseFloat(String(v)));
    return (
      pick(data?.price_change_percentage_24h) ??
      pick(data?.price_change_percentage?.h24) ??
      pick(data?.price_change?.h24) ??
      pick(data?.price_change_24h) ??
      0
    );
  })();

  // 24h出来高（h24 か 24h のどちらか）
  const volume24 = Number(data?.volume_usd?.h24 ?? data?.volume_usd_24h ?? 0);

  // 流動性（どちらかに入っている）
  const liquidity = Number(data?.reserve_in_usd ?? data?.liquidity_usd ?? 0);

  return { priceUsd, pc24h, volume24, liquidity };
}, [data]);



  return { loading, error, data: parsed };
}

function Card({ title, note, poolId }) {
  const { loading, error, data } = usePool(poolId);

  return (
    <div className="rounded-2xl shadow-md p-4 border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {note && <p className="text-xs opacity-60 mt-1">{note}</p>}
          <p className="text-[10px] opacity-50 mt-1 break-all">Pool ID: {poolId}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full border opacity-70">Katana V3</span>
      </div>

      <div className="mt-4">
        {loading && <p className="text-sm opacity-60">Loading…</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {!loading && !error && data && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="opacity-60">Price (USD)</p>
              <p className="text-xl font-bold">
                {data.priceUsd ? `$${data.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "—"}
              </p>
            </div>
            <div>
              <p className="opacity-60">24h Change</p>
              <p className={`font-semibold ${data.pc24h > 0 ? "text-green-600" : data.pc24h < 0 ? "text-red-600" : ""}`}>
                {Number.isFinite(data.pc24h) ? `${data.pc24h.toFixed(2)}%` : "—"}
              </p>
            </div>
            <div>
              <p className="opacity-60">24h Volume</p>
              <p className="font-medium">
                {`$${data.volume24.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </p>
            </div>
            <div>
              <p className="opacity-60">Liquidity (TVL)</p>
              <p className="font-medium">
                {`$${data.liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <a
          href={`https://www.geckoterminal.com/${NETWORK}/pools/${poolId}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline opacity-80 hover:opacity-100"
        >
          Open on GeckoTerminal ↗
        </a>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Ronin Price Widgets</h1>
      <p className="text-sm opacity-60 mt-1">COIN / RICE / RONKE をまとめて監視</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {POOLS.map((p) => (
          <Card key={p.id} title={p.label} note={p.note} poolId={p.id} />
        ))}
      </div>
    </div>
  );
}
