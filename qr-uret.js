#!/usr/bin/env node
/**
 * QR üretici — menü linkinden baskıya hazır QR kodu ve masa kartı çıkarır.
 *
 *   node qr-uret.js "https://menu-adresin.com"              → tek QR (masasız menü)
 *   node qr-uret.js "https://menu-adresin.com" --masa 12    → 1..12 masa için ayrı QR
 *
 * Masalı kullanımda her QR adrese kendi masa numarasını ekler (?masa=7),
 * böylece sipariş hangi masadan geldiği belli olur.
 *
 * Üretilenler (cikti/ klasörü):
 *   qr.png / qr.svg           masasız tek QR
 *   masa-01.png … masa-NN.png masa başına QR (baskı için 2000px)
 *   masa-karti.html           tarayıcıda aç → yazdır → kesilmeye hazır kartlar
 */

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const args = process.argv.slice(2);
const url = args[0];

if (!url) {
  console.error('Kullanım: node qr-uret.js "https://menu-adresin.com" [--masa 12]');
  process.exit(1);
}

const masaIndex = args.indexOf("--masa");
const masaSayisi = masaIndex > -1 ? parseInt(args[masaIndex + 1], 10) : 0;

if (masaIndex > -1 && (!Number.isInteger(masaSayisi) || masaSayisi < 1 || masaSayisi > 200)) {
  console.error("--masa 1 ile 200 arasında bir tam sayı olmalı.");
  process.exit(1);
}

const ISLETME = "ARDA BÜFE";
const OUT = path.join(__dirname, "cikti");
fs.mkdirSync(OUT, { recursive: true });

// Yüksek hata düzeltme (H): kart lekelense/çizilse de okunur.
const opts = { errorCorrectionLevel: "H", margin: 2, color: { dark: "#0C0A09", light: "#FFFFFF" } };

/** Masa numarasını adrese ekler, mevcut sorgu parametrelerini bozmadan. */
function masaliAdres(temel, masa) {
  const u = new URL(temel);
  u.searchParams.set("masa", String(masa));
  return u.toString();
}

function kartHtml(kartlar) {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${ISLETME} — Masa Kartları</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #E8E4E0;
    font-family: "Avenir Next Condensed", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif;
    color: #0C0A09;
  }
  .sheet {
    width: 190mm; margin: 0 auto; padding: 4mm 0;
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm;
  }
  .card {
    background: #0C0A09; color: #F6F0EA;
    border: 1px dashed rgba(255,255,255,.18);
    padding: 7mm 6mm; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 2.5mm;
    break-inside: avoid;
  }
  .brand { font-size: 16pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; margin: 0; }
  .brand em { font-style: normal; color: #E23A21; }
  .kicker { font-size: 7.5pt; letter-spacing: .3em; text-transform: uppercase; color: #A2938A; margin: 0; padding-left: .3em; }
  .masa {
    font-size: 13pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    margin: 0; color: #0C0A09; background: #E23A21; padding: 1.2mm 5mm;
  }
  .bar { width: 34mm; height: 1.2mm; background: #E23A21; }
  .qr { width: 44mm; height: 44mm; background: #fff; padding: 2.5mm; }
  .qr img { width: 100%; height: 100%; display: block; }
  .cta { font-size: 10pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin: 0; }
  .hint { font-size: 7.5pt; color: #A2938A; margin: 0; letter-spacing: .04em; }
  .note { max-width: 190mm; margin: 6mm auto 0; font-size: 9pt; color: #5A5049; text-align: center; font-family: system-ui, sans-serif; }
  @media print { body { background: #fff; } .note { display: none; } .card { border-color: #333; } }
</style>
</head>
<body>
  <div class="sheet">
    ${kartlar.join("\n    ")}
  </div>
  <p class="note">Bu sayfayı yazdırın (Cmd+P → A4, kenar boşluğu yok, arka plan grafikleri açık). Yazdırma önizlemesinde bu not görünmez.</p>
</body>
</html>`;
}

function kart(dataUri, masa) {
  return `<div class="card">
      <p class="kicker">Tost &middot; Dürüm &middot; Patso</p>
      <h1 class="brand">${ISLETME.replace(" ", " <em>")}</em></h1>
      ${masa ? `<p class="masa">Masa ${masa}</p>` : `<div class="bar"></div>`}
      <div class="qr"><img src="${dataUri}" alt="Menü QR kodu" /></div>
      <p class="cta">${masa ? "Sipariş için okutun" : "Menü için okutun"}</p>
      <p class="hint">Telefonun kamerasını QR'a tutmanız yeterli</p>
    </div>`;
}

(async () => {
  const kartlar = [];

  if (masaSayisi) {
    for (let m = 1; m <= masaSayisi; m++) {
      const adres = masaliAdres(url, m);
      const dosya = "masa-" + String(m).padStart(2, "0") + ".png";
      await QRCode.toFile(path.join(OUT, dosya), adres, { ...opts, width: 2000 });
      kartlar.push(kart(await QRCode.toDataURL(adres, { ...opts, width: 600 }), m));
    }
    console.log("QR hedefi : " + url + "?masa=1 … ?masa=" + masaSayisi);
    console.log("Üretildi  : cikti/masa-01.png … masa-" + String(masaSayisi).padStart(2, "0") + ".png");
  } else {
    await QRCode.toFile(path.join(OUT, "qr.png"), url, { ...opts, width: 2000 });
    await QRCode.toFile(path.join(OUT, "qr.svg"), url, { ...opts, type: "svg" });
    const dataUri = await QRCode.toDataURL(url, { ...opts, width: 600 });
    for (let i = 0; i < 6; i++) kartlar.push(kart(dataUri, null));
    console.log("QR hedefi : " + url);
    console.log("Üretildi  : cikti/qr.png, cikti/qr.svg");
  }

  fs.writeFileSync(path.join(OUT, "masa-karti.html"), kartHtml(kartlar), "utf8");
  console.log("            cikti/masa-karti.html (" + kartlar.length + " kart)");
})();
