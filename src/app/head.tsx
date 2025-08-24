// src/app/head.tsx
export default function Head() {
  return (
    <>
      <title>Ronin Price Widgets</title>
      <meta name="description" content="COIN / RICE / RONKE monitor" />

      {/* ✅ AdSense 所有権確認（メタタグ方式） */}
      <meta name="google-adsense-account" content="ca-pub-7486115105644729" />

      {/* ✅ AdSense 自動広告スニペット（生<script>で head に出力） */}
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7486115105644729"
        crossOrigin="anonymous"
      ></script>
    </>
  );
}
