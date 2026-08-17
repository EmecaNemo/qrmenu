#!/usr/bin/env node
/**
 * QR üretici — menü linkinden baskıya hazır QR kodu ve masa kartı çıkarır.
 *
 *   node qr-uret.js "https://menu-adresin.com"
 *
 * Üretilenler (cikti/ klasörü):
 *   qr.png          2000px, baskı için (etiket, sticker, tabela)
 *   qr.svg          vektör, her boyuta ölçeklenir
 *   masa-karti.html tarayıcıda aç → yazdır → A4'te 6 adet masa kartı
 */

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const url = process.argv[2];
if (!url) {
  console.error('Kullanım: node qr-uret.js "https://menu-adresin.com"');
  process.exit(1);
}

const ISLETME = "ARDA BÜFE";
const OUT = path.join(__dirname, "cikti");
fs.mkdirSync(OUT, { recursive: true });

// Yüksek hata düzeltme (H): kart lekelense/çizilse de okunur.
const opts = { errorCorrectionLevel: "H", margin: 2, color: { dark: "#0C0A09", light: "#FFFFFF" } };

(async () => {
  await QRCode.toFile(path.join(OUT, "qr.png"), url, { ...opts, width: 2000 });
  await QRCode.toFile(path.join(OUT, "qr.svg"), url, { ...opts, type: "svg" });
  const dataUri = await QRCode.toDataURL(url, { ...opts, width: 600 });

  const card = `<!doctype html>
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
    padding: 8mm 6mm; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 3mm;
    break-inside: avoid;
  }
  .brand { font-size: 17pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; margin: 0; }
  .brand em { font-style: normal; color: #E23A21; }
  .kicker { font-size: 7.5pt; letter-spacing: .3em; text-transform: uppercase; color: #A2938A; margin: 0; padding-left: .3em; }
  .bar { width: 34mm; height: 1.2mm; background: #E23A21; }
  .qr { width: 46mm; height: 46mm; background: #fff; padding: 2.5mm; }
  .qr img { width: 100%; height: 100%; display: block; }
  .cta { font-size: 10.5pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin: 0; }
  .hint { font-size: 7.5pt; color: #A2938A; margin: 0; letter-spacing: .04em; }
  .note { max-width: 190mm; margin: 6mm auto 0; font-size: 9pt; color: #5A5049; text-align: center; font-family: system-ui, sans-serif; }
  @media print { body { background: #fff; } .note { display: none; } .card { border-color: #333; } }
</style>
</head>
<body>
  <div class="sheet">
    ${Array.from({ length: 6 }).map(() => `<div class="card">
      <p class="kicker">Tost &middot; Dürüm &middot; Patso</p>
      <h1 class="brand">${ISLETME.replace(" ", " <em>")}</em></h1>
      <div class="bar"></div>
      <div class="qr"><img src="${dataUri}" alt="Menü QR kodu" /></div>
      <p class="cta">Menü için okutun</p>
      <p class="hint">Telefonun kamerasını QR'a tutmanız yeterli</p>
    </div>`).join("\n    ")}
  </div>
  <p class="note">Bu sayfayı yazdırın (Cmd+P → A4, kenar boşluğu yok). Yazdırma önizlemesinde bu not görünmez.</p>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT, "masa-karti.html"), card, "utf8");

  console.log("QR hedefi : " + url);
  console.log("Üretildi  : cikti/qr.png, cikti/qr.svg, cikti/masa-karti.html");
})();
