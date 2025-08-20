// src/app/api/gt-price/route.ts
import { NextResponse } from "next/server";

const NETWORK = "ronin";
const POOL = "0xda021b3d91f82bf2bcfc1a8709545c3a643d47de"; // COIN/WRON

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${NETWORK}/pools/${POOL}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    // 安全に JSON をパース（any を使わない）
    const raw: unknown = await res.json();
    if (raw === null || typeof raw !== "object") {
      return NextResponse.json({ error: "Invalid response" }, { status: 502 });
    }
    const data = (raw as Record<string, unknown>)["data"] as
      | Record<string, unknown>
      | undefined;
    const attrs = data?.["attributes"] as Record<string, unknown> | undefined;

    const name =
      typeof attrs?.["name"] === "string" ? (attrs["name"] as string) : "";
    const [left, right] = name
      .split("/")
      .map((s) => s.trim().replace(/^\$?/, "").toUpperCase());

    const baseVal = attrs?.["base_token_price_usd"];
    const quoteVal = attrs?.["quote_token_price_usd"];

    const baseUsd =
      typeof baseVal === "number"
        ? baseVal
        : typeof baseVal === "string"
        ? parseFloat(baseVal)
        : NaN;

    const quoteUsd =
      typeof quoteVal === "number"
        ? quoteVal
        : typeof quoteVal === "string"
        ? parseFloat(quoteVal)
        : NaN;

    // どちら側が COIN / WRON かを name から判定してUSD価格を確定
    let coinUsd: number | null = null;
    let wronUsd: number | null = null;
    if (left === "COIN") {
      coinUsd = baseUsd;
      wronUsd = quoteUsd;
    } else if (right === "COIN") {
      coinUsd = quoteUsd;
      wronUsd = baseUsd;
    } else {
      // フォールバック
      coinUsd = Number.isFinite(baseUsd) ? baseUsd : Number.isFinite(quoteUsd) ? quoteUsd : null;
      wronUsd = Number.isFinite(quoteUsd) ? quoteUsd : Number.isFinite(baseUsd) ? baseUsd : null;
    }

    if (!Number.isFinite(coinUsd ?? NaN) || !Number.isFinite(wronUsd ?? NaN)) {
      return NextResponse.json({ error: "Price fields not found" }, { status: 502 });
    }

    // WRON/COIN = (USD/COIN) / (USD/WRON)
    const wronPerCoin = (coinUsd as number) / (wronUsd as number);

    return NextResponse.json(
      {
        coinUsd,
        wronPerCoin,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
