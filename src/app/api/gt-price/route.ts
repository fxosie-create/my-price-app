import { NextResponse } from "next/server";

const NETWORK = "ronin";
const POOL = "0xda021b3d91f82bf2bcfc1a8709545c3a643d47de"; // COIN/WRON

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${NETWORK}/pools/${POOL}`;
    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });

    const attrs = (await res.json())?.data?.attributes ?? {};
    const name: string = attrs?.name ?? "";
    const [left, right] = name.split("/").map((s: string) => s.trim().replace(/^\$?/, "").toUpperCase());

    const baseUsd = parseFloat(attrs?.base_token_price_usd ?? "");
    const quoteUsd = parseFloat(attrs?.quote_token_price_usd ?? "");

    // どちら側が COIN / WRON かを name から判定し、USD価格を決める
    let coinUsd: number | null = null;
    let wronUsd: number | null = null;
    if (left === "COIN") {
      coinUsd = baseUsd;
      wronUsd = quoteUsd;
    } else if (right === "COIN") {
      coinUsd = quoteUsd;
      wronUsd = baseUsd;
    } else {
      // フォールバック（万一 name が想定外ならベース/クオートから推測）
      coinUsd = baseUsd || quoteUsd || null;
      wronUsd = quoteUsd || baseUsd || null;
    }

    if (!Number.isFinite(coinUsd) || !Number.isFinite(wronUsd)) {
      return NextResponse.json({ error: "Price fields not found" }, { status: 500 });
    }

    // WRON/COIN = (USD/COIN) / (USD/WRON)
    const wronPerCoin = coinUsd! / wronUsd!;
    return NextResponse.json(
      {
        coinUsd,
        wronPerCoin,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
