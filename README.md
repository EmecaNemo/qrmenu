# QR Menü — örnek şablon (Arda Büfe)

Telefon için tek dosyalık dijital menü + baskıya hazır QR kod ve masa kartları.
Müşteri adaylarına gösterilmek üzere hazırlanmış demo; her işletme için içerik ve
renk şeması değiştirilerek yeniden kullanılır.

**Canlı adres:** <https://emecanemo.github.io/qrmenu/> — QR kodları bu adresi gösterir.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Müşteri menüsü — veri, tasarım ve sepet tek dosyada. Menüyü buradan düzenle. |
| `panel.html` | Mutfak/garson paneli — gelen siparişler, durum düğmeleri. |
| `siparis-servisi.js` | Menü ile panel arasındaki bağlantı katmanı. Arka uç ayarı burada. |
| `supabase-kurulum.sql` | Gerçek sunucu için veritabanı kurulumu. |
| `qr-uret.js` | Menü linkinden QR kodu ve masa kartı üretir. |
| `cikti/masa-NN.png` | Masa başına QR (2000px, baskı için). |
| `cikti/masa-karti.html` | Tarayıcıda aç → yazdır → kesilmeye hazır masa kartları. |

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

`index.html` dosyasını kopyala ve içindeki üç bölümü düzenle.

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

Teslim edilen menüde tema barını kaldırmak için `index.html` içindeki
`<div class="palette-bar">` ve `<button class="pb-reopen">` satırlarını sil,
`VARSAYILAN_PALET` değerini müşterinin temasına ayarla.

---

---

## Sipariş sistemi

Müşteri masadaki QR'ı okutur → menüden ürün seçer → siparişi gönderir →
mutfak panelinde anında belirir → mutfak "hazır" der → müşterinin ekranı canlı güncellenir.

### Masa numarası

Sipariş yalnızca adreste masa numarası varsa açılır:

```
https://emecanemo.github.io/qrmenu/?masa=5
```

Masa numarası yoksa menü **salt okunur** kalır — ekleme düğmeleri hiç görünmez.
Bu, "menüyü internetten açan" ile "masada oturan" müşteriyi ayırır.

Masa başına QR üretmek:

```sh
node qr-uret.js "https://emecanemo.github.io/qrmenu/" --masa 12
```

`cikti/masa-01.png` … `masa-12.png` ve 12 kartlık `masa-karti.html` çıkar.
Her kartın üstünde masa numarası yazar.

### İki çalışma modu

`siparis-servisi.js` dosyasının başındaki `SiparisAyar.mod` değeri belirler:

| Mod | Ne yapar | Nerede kullanılır |
|---|---|---|
| `"yerel"` | Siparişler tarayıcının hafızasında. Aynı tarayıcının sekmeleri birbirini görür. | **Demo.** Farklı cihazlar birbirini görmez. |
| `"supabase"` | Siparişler gerçek sunucuda. Telefon ve mutfak tableti canlı bağlı. | **Gerçek servis.** |

**Demoyu göstermek için** (kurulum gerekmez): bilgisayarda iki sekme aç —
biri `index.html?masa=5`, diğeri `panel.html`. Sipariş ver, panele anında düşsün.

### Gerçek sunucuya geçiş

1. [supabase.com](https://supabase.com) üzerinde ücretsiz bir proje aç
2. SQL Editor'e `supabase-kurulum.sql` dosyasını yapıştır ve çalıştır
3. Settings → API'den **Project URL** ve **anon public key** değerlerini kopyala
4. `siparis-servisi.js` içindeki `SiparisAyar` bloğuna gir, `mod`'u `"supabase"` yap
5. `git push` ile yayına al
6. İki ayrı cihazdan test et: telefondan sipariş ver, tablette görün

> Panel adresine `?supabase=1` eklersen dosyayı değiştirmeden sunucu modunu
> deneyebilirsin: `panel.html?supabase=1`

### Bilinmesi gerekenler

- **Güvenlik:** anon key statik sitede herkese görünür. Tek işletme için sorun
  değil, ama birden fazla işletmeye satmadan önce `supabase-kurulum.sql`
  içindeki güvenlik notlarını uygula.
- **Fiyat aralıkları:** `"90,00 – 100,00"` gibi aralıklı fiyatlarda sepet **alt
  sınırı** kullanır. Sipariş alan bir menüde aralıklı fiyat kullanma — ürünü
  ayrı kalemlere böl.
- **Sipariş kaybı:** internet koptuğunda sipariş gitmez ve müşteri uyarı görür.
  Gerçek serviste mutfak paneli her zaman açık ve sesli olmalı; personel
  siparişin panelde göründüğünü teyit etmeli.
- **Ses:** tarayıcılar izinsiz ses çalmaz. Panelde bir kez **🔔 Sesi aç**
  düğmesine basılmalı — vardiya başında yapılacak ilk iş.

---

## QR kodu üretmek

```sh
node qr-uret.js "https://menu-adresin.com"              # tek QR (siparişsiz menü)
node qr-uret.js "https://menu-adresin.com" --masa 12    # masa başına QR
```

`cikti/` klasörü yenilenir. QR **H seviyesi** hata düzeltmeli —
kart lekelense veya çizilse de okunur.

Menü adresi sabit kaldığı sürece fiyat değişiklikleri QR'ı etkilemez:
aynı kart her zaman güncel menüyü gösterir, kartları tekrar bastırmaya gerek olmaz.

## Masa kartlarını basmak

1. `cikti/masa-karti.html` dosyasını tarayıcıda aç
2. `Cmd + P` → **A4**, kenar boşlukları **yok**, **arka plan grafiklerini yazdır** açık
3. Kes ve laminasyon yaptır

İşletme adını değiştirmek için `qr-uret.js` içindeki `ISLETME` sabitini düzenle.

---

## Değişikliği yayına almak

`index.html` düzenlendikten sonra:

```sh
git add -A && git commit -m "fiyat güncellemesi" && git push
```

Bir dakika içinde <https://emecanemo.github.io/qrmenu/> güncellenir. **QR değişmez** —
basılı kartlar aynen çalışmaya devam eder.

## Notlar

- Menü fotoğrafı kısmiydi: **içecekler ve tatlılar** bu listede yok.
- QR'ı bastırmadan önce mutlaka kendi telefonunla okut ve menünün açıldığını doğrula.
- **QR'da claude.ai adresi kullanma:** telefondaki Claude uygulaması o adresi kendine
  ait sayıp araya giriyor, menü yerine uygulama açılıyor. Menü kendi alan adında durmalı.
- Gerçek müşteriye kart bastırırken `github.io` yerine kendi alan adını kullan
  (örn. `qrmenum.com/ardabufe`). Adres yıllarca masada duracak, senin kontrolünde olsun.
