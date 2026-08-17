# QR Menü — örnek şablon (Arda Büfe)

Telefon için tek dosyalık dijital menü + baskıya hazır QR kod ve masa kartları.
Müşteri adaylarına gösterilmek üzere hazırlanmış demo; her işletme için içerik ve
renk şeması değiştirilerek yeniden kullanılır.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `menu.html` | Menünün tamamı — veri, tasarım ve kod tek dosyada. |
| `qr-uret.js` | Menü linkinden QR kodu ve masa kartı üretir. |
| `cikti/qr.png` | 2000px QR — sticker, etiket, tabela baskısı için. |
| `cikti/qr.svg` | Vektör QR — her boyuta bozulmadan büyür. |
| `cikti/masa-karti.html` | Tarayıcıda aç → yazdır → A4 kağıtta 6 adet masa kartı. |

---

## Satış görüşmesinde nasıl gösterilir

1. Telefonunda menüyü aç (veya masa kartındaki QR'ı işletmeciye okut).
2. Alttaki **Renk şeması** barından dört temayı sırayla göster:
   **Kömür** (büfe/ocakbaşı) · **Zeytin** (esnaf lokantası/kebapçı) ·
   **Mürekkep** (balık/meyhane) · **Kâğıt** (kahvaltı salonu/pastane).
3. Barın sağındaki **×** ile barı gizle — müşterinin gerçek menüsünde bu bar olmaz,
   tema baştan sabitlenir. Gizlendikten sonra sağ alttaki **Tema** düğmesiyle geri gelir.

Seçilen tema tarayıcıda hatırlanır; gösterimden sonra **Kömür**'e geri alman iyi olur.

---

## Yeni müşteri için menü hazırlamak

`menu.html` dosyasını kopyala ve içindeki üç bölümü düzenle.

### 1 · Ürünler ve fiyatlar — `MENU` dizisi

```js
{ name: "Kaşarlı Tost", price: "80,00", art: "tost" },
```

| Alan | Açıklama |
|---|---|
| `name` | Ürün adı |
| `price` | Yazıldığı gibi görünür; aralık da olur: `"90,00 – 100,00"` |
| `art` | Çizim adı. Bölümün `art` değeri varsayılandır, ürün kendi değeriyle ezer. |
| `photo` | **Gerçek fotoğraf.** `photo: "foto/tost.jpg"` yazarsan çizim yerine fotoğraf gelir. |
| `note` | Ürünün altına küçük açıklama satırı |
| `star` | `true` ise ürün büyük spesiyal kartı olarak gösterilir |
| `tag` | Spesiyal kartının üstündeki küçük etiket (örn. "Evin spesiyali") |

Yeni bölüm eklemek için mevcut bloklardan birini kopyala, `id`, `nav` ve `title`
değerlerini değiştir. En üstteki `GUNCELLEME` tarihini de güncelle.

### 2 · Gerçek fotoğraflar

Şu an ürünlerde çizim var — fotoğraf gelene kadar boşluk görünmesin diye.
Gerçek fotoğrafa geçmek için:

1. Fotoğrafları `foto/` klasörüne koy (kare kırpılır, **800×800 px** ideal, JPG).
2. İlgili ürüne `photo: "foto/dosya-adi.jpg"` satırını ekle.

Karışık kullanım serbest: fotoğrafı olan ürün fotoğrafı, olmayan çizimi gösterir.

> Spesiyal kartındaki görsel 16:7 oranında gösterilir — o ürün için yatay fotoğraf seç.

### 3 · Renk şeması

Dört tema hazır. Müşterinin kendi renkleri gerekiyorsa `:root[data-palette="..."]`
bloklarından birini kopyala, hex değerleri değiştir ve `PALETLER` dizisine bir satır ekle.

Teslim edilen menüde tema barını kaldırmak için `menu.html` içindeki
`<div class="palette-bar">` ve `<button class="pb-reopen">` satırlarını sil,
`VARSAYILAN_PALET` değerini müşterinin temasına ayarla.

---

## QR kodu üretmek

```sh
node qr-uret.js "https://menu-adresin.com"
```

`cikti/` klasöründeki üç dosya yenilenir. QR **H seviyesi** hata düzeltmeli —
kart lekelense veya çizilse de okunur.

Menü adresi sabit kaldığı sürece fiyat değişiklikleri QR'ı etkilemez:
aynı kart her zaman güncel menüyü gösterir, kartları tekrar bastırmaya gerek olmaz.

## Masa kartlarını basmak

1. `cikti/masa-karti.html` dosyasını tarayıcıda aç
2. `Cmd + P` → **A4**, kenar boşlukları **yok**, **arka plan grafiklerini yazdır** açık
3. Kes ve laminasyon yaptır

İşletme adını değiştirmek için `qr-uret.js` içindeki `ISLETME` sabitini düzenle.

---

## Notlar

- Menü fotoğrafı kısmiydi: **içecekler ve tatlılar** bu listede yok.
- QR'ı bastırmadan önce mutlaka kendi telefonunla okut ve menünün açıldığını doğrula.
- Menü linki herkese açık olmalı; aksi halde müşteri QR'ı okuttuğunda sayfayı göremez.
