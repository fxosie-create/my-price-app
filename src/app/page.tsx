"use client";
import React, { useEffect, useMemo, useState } from "react";

const NETWORK = "ronin";
const API = (poolId: string) =>
  `https://api.geckoterminal.com/api/v2/networks/${NETWORK}/pools/${poolId}`;

/** ====== 型定義 ====== */
interface VolumeUSD {
  h24?: string; // APIが文字列で返すことが多い
}
interface PoolAttributes {
  name?: string;
  base_token_price_usd?: string;
  price_usd?: string;
  quote_token_price_usd?: string;
  price_change_percentage_24h?: string | number;
  volume_usd?: VolumeUSD;
  volume_usd_24h?: string | number; // ネットワークによってはこちらが入ることも
  reserve_in_usd?: string | number;
  liquidity_usd?: string | number;
}
interface GeckoTerminalResponse {
  data?: {
    attributes?: PoolAttributes;
  };
}

/** ====== 表示したいプール ====== */
const POOLS = [
  {
    id: "0xda021b3d91f82bf2bcfc1a8709545c3a643d47de", // COIN / WRON
    label: "COIN / WRON",
    note: "CraftWorld COIN プール",
  },
  {
    id: "0x93171ecace2f6b8be8dd09539f55fabe7f805af1", // RICE / Ronke (V3)
    label: "RICE / Ronke (Katana V3)",
    note: "Ronke Rice Farmers",
  },
  {
    id: "0x75ae353997242927c701d4d6c2722ebef43fd2d3", // RONKE / WRON
    label: "RONKE / WRON (Katana)",
    note: "Ronke Token",
  },
] as const;

function usePool(poolId: string) {
  const [raw, setRaw] = useState<PoolAttributes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true as boolean;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API(poolId), {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Upstream ${res.status}`);
        const json = (await res.json()) as GeckoTerminalResponse;
        if (alive) setRaw(json?.data?.attributes ?? null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (alive) setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    const t = setInterval(run, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [poolId]);

  const data = useMemo(() => {
    if (!raw) return null;

    const num = (v: string | number | undefined): number =>
      v === undefined ? 0 : typeof v === "number" ? v : Number(v);

    const priceUsd = num(
      raw.base_token_price_usd ?? raw.price_usd ?? raw.quote_token_price_usd
    );
    const pc24h = num(raw.price_change_percentage_24h);
    const volume24 = num(raw.volume_usd?.h24 ?? raw.volume_usd_24h);
    const liquidity = num(raw.reserve_in_usd ?? raw.liquidity_usd);

    return { priceUsd, pc24h, volume24, liquidity };
  }, [raw]);

  return { loading, error, data };
}

function Card({
  title,
  note,
  poolId,
}: {
  title: string;
  note?: string;
  poolId: string;
}) {
  const { loading, error, data } = usePool(poolId);
  return (
    <div className="rounded-2xl shadow-md p-4 border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {note && <p className="text-xs opacity-60 mt-1">{note}</p>}
          <p className="text-[10px] opacity-50 mt-1 break-all">Pool ID: {poolId}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full border opacity-70">
          Katana V3
        </span>
      </div>

      <div className="mt-4">
        {loading && <p className="text-sm opacity-60">Loading…</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {!loading && !error && data && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="opacity-60">Price (USD)</p>
              <p className="text-xl font-bold">
                {data.priceUsd
                  ? `$${data.priceUsd.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="opacity-60">24h Change</p>
              <p
                className={`font-semibold ${
                  data.pc24h > 0
                    ? "text-green-600"
                    : data.pc24h < 0
                    ? "text-red-600"
                    : ""
                }`}
              >
                {Number.isFinite(data.pc24h)
                  ? `${data.pc24h.toFixed(2)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="opacity-60">24h Volume</p>
              <p className="font-medium">
                {`$${data.volume24.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`}
              </p>
            </div>
            <div>
              <p className="opacity-60">Liquidity (TVL)</p>
              <p className="font-medium">
                {`$${data.liquidity.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end">
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
