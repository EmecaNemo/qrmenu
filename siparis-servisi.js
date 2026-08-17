/* ============================================================================
   SİPARİŞ SERVİSİ — menü ile mutfak paneli arasındaki bağlantı katmanı
   ============================================================================

   İki mod var. Tek değiştirmen gereken yer aşağıdaki AYAR bloğu.

   · "yerel"    Siparişler tarayıcının kendi hafızasında tutulur.
                AYNI bilgisayarın sekmeleri birbirini görür — demo için birebir.
                FARKLI cihazlar birbirini GÖRMEZ. Gerçek serviste kullanılamaz.

   · "supabase" Siparişler gerçek sunucuda tutulur. Müşterinin telefonu ile
                mutfaktaki tablet canlı olarak birbirini görür.
                Kurulum için README'deki "Sipariş sistemi" bölümüne bak.

   Sipariş nesnesi:
   {
     id: "1723890000000-a1b2",
     masa: "5",
     urunler: [{ ad: "Kaşarlı Tost", fiyat: 80, adet: 2 }],
     toplam: 160,
     siparisNotu: "Az pişmiş olsun",
     durum: "yeni" | "hazirlaniyor" | "hazir" | "teslim" | "iptal",
     olusturma: 1723890000000
   }
   ========================================================================== */

window.SiparisAyar = {
  mod: "yerel",                     // "yerel" veya "supabase"
  supabase: {
    url: "",                        // https://xxxx.supabase.co
    anonKey: ""                     // public anon key
  }
};

window.SiparisServisi = (function () {
  "use strict";

  const ANAHTAR = "qrmenu-siparisler";
  const KANAL   = "qrmenu-siparis";
  const DURUMLAR = ["yeni", "hazirlaniyor", "hazir", "teslim", "iptal"];

  const aboneler = [];
  let sb = null;          // supabase istemcisi
  let onbellek = [];      // supabase modunda son bilinen liste

  /* ----------------------------------------------------------- yardımcılar */

  function yeniId() {
    return Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  }

  /** "1.250,00" → 1250 · "90,00 – 100,00" → 90 (alt sınır) */
  function fiyatSayi(metin) {
    if (typeof metin === "number") return metin;
    const ilk = String(metin).split(/[–—-]/)[0];
    const sayi = parseFloat(ilk.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
    return isNaN(sayi) ? 0 : sayi;
  }

  function paraYaz(sayi) {
    return sayi.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function bildir(liste) {
    for (const cb of aboneler) {
      try { cb(liste); } catch (e) { console.error("[siparis] abone hatası", e); }
    }
  }

  /* ------------------------------------------------------------ YEREL mod */

  const bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KANAL) : null;

  function yerelOku() {
    try { return JSON.parse(localStorage.getItem(ANAHTAR)) || []; }
    catch (e) { return []; }
  }

  function yerelYaz(liste) {
    try { localStorage.setItem(ANAHTAR, JSON.stringify(liste)); }
    catch (e) { console.error("[siparis] yazılamadı", e); }
    if (bc) bc.postMessage("degisti");
    bildir(liste);
  }

  if (bc) bc.onmessage = () => { if (AYAR().mod === "yerel") bildir(yerelOku()); };
  window.addEventListener("storage", e => {
    if (e.key === ANAHTAR && AYAR().mod === "yerel") bildir(yerelOku());
  });

  function AYAR() { return window.SiparisAyar; }

  /* --------------------------------------------------------- SUPABASE mod */

  function kutuphaneYukle() {
    if (window.supabase) return Promise.resolve();
    return new Promise((coz, hata) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = coz;
      s.onerror = () => hata(new Error("Supabase kütüphanesi yüklenemedi"));
      document.head.appendChild(s);
    });
  }

  function satirdanSiparis(r) {
    return {
      id: r.id,
      masa: r.masa,
      urunler: r.urunler || [],
      toplam: Number(r.toplam) || 0,
      siparisNotu: r.siparis_notu || "",
      durum: r.durum,
      olusturma: new Date(r.olusturma).getTime()
    };
  }

  async function supabaseBaslat() {
    const ayar = AYAR().supabase;
    if (!ayar.url || !ayar.anonKey) {
      throw new Error("Supabase url ve anonKey girilmemiş — siparis-servisi.js içindeki AYAR bloğuna bak.");
    }
    await kutuphaneYukle();
    sb = window.supabase.createClient(ayar.url, ayar.anonKey);

    const { data, error } = await sb.from("siparisler").select("*").order("olusturma", { ascending: false });
    if (error) throw error;
    onbellek = (data || []).map(satirdanSiparis);
    bildir(onbellek);

    sb.channel("siparis-akisi")
      .on("postgres_changes", { event: "*", schema: "public", table: "siparisler" }, async () => {
        const { data: yeni } = await sb.from("siparisler").select("*").order("olusturma", { ascending: false });
        onbellek = (yeni || []).map(satirdanSiparis);
        bildir(onbellek);
      })
      .subscribe();
  }

  /* ------------------------------------------------------------ genel API */

  let hazirSozu = null;

  function baslat() {
    if (hazirSozu) return hazirSozu;
    hazirSozu = (AYAR().mod === "supabase")
      ? supabaseBaslat()
      : Promise.resolve().then(() => bildir(yerelOku()));
    return hazirSozu;
  }

  /** Değişiklikleri dinle. Çağrıldığı anda mevcut listeyi de verir. */
  function abone(geriCagri) {
    aboneler.push(geriCagri);
    baslat().then(() => {
      if (AYAR().mod === "yerel") geriCagri(yerelOku());
      else geriCagri(onbellek);
    }).catch(e => console.error("[siparis] başlatılamadı", e));
    return () => {
      const i = aboneler.indexOf(geriCagri);
      if (i > -1) aboneler.splice(i, 1);
    };
  }

  async function gonder(siparis) {
    const kayit = {
      id: yeniId(),
      masa: String(siparis.masa),
      urunler: siparis.urunler,
      toplam: siparis.toplam,
      siparisNotu: siparis.siparisNotu || "",
      durum: "yeni",
      olusturma: Date.now()
    };

    await baslat();

    if (AYAR().mod === "supabase") {
      const { error } = await sb.from("siparisler").insert({
        id: kayit.id,
        masa: kayit.masa,
        urunler: kayit.urunler,
        toplam: kayit.toplam,
        siparis_notu: kayit.siparisNotu,
        durum: kayit.durum,
        olusturma: new Date(kayit.olusturma).toISOString()
      });
      if (error) throw error;
    } else {
      const liste = yerelOku();
      liste.unshift(kayit);
      yerelYaz(liste);
    }

    return kayit;
  }

  async function durumGuncelle(id, durum) {
    if (!DURUMLAR.includes(durum)) throw new Error("Geçersiz durum: " + durum);
    await baslat();

    if (AYAR().mod === "supabase") {
      const { error } = await sb.from("siparisler").update({ durum }).eq("id", id);
      if (error) throw error;
    } else {
      const liste = yerelOku();
      const s = liste.find(x => x.id === id);
      if (s) { s.durum = durum; yerelYaz(liste); }
    }
  }

  /** Tek siparişi takip et (müşteri tarafı: "hazırlanıyor / hazır" bildirimi). */
  function takip(id, geriCagri) {
    return abone(liste => {
      const s = liste.find(x => x.id === id);
      if (s) geriCagri(s);
    });
  }

  /** Demo sıfırlama — yalnızca yerel modda çalışır. */
  async function hepsiniSil() {
    if (AYAR().mod === "supabase") {
      await baslat();
      const { error } = await sb.from("siparisler").delete().neq("id", "");
      if (error) throw error;
    } else {
      yerelYaz([]);
    }
  }

  return { baslat, abone, gonder, durumGuncelle, takip, hepsiniSil, fiyatSayi, paraYaz, DURUMLAR };
})();
