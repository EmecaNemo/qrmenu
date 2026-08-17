-- ============================================================================
-- SİPARİŞ SİSTEMİ — Supabase kurulumu
-- ============================================================================
-- Bunu Supabase panelinde SQL Editor'e yapıştırıp çalıştır.
-- Sonra siparis-servisi.js içindeki SiparisAyar bloğuna url + apiKey gir
-- ve mod'u "supabase" yap.
-- ============================================================================

create table if not exists siparisler (
  id            text primary key,
  masa          text not null,
  urunler       jsonb not null,
  toplam        numeric(10,2) not null,
  siparis_notu  text default '',
  durum         text not null default 'yeni'
                check (durum in ('yeni','hazirlaniyor','hazir','teslim','iptal')),
  olusturma     timestamptz not null default now()
);

create index if not exists siparisler_olusturma_idx on siparisler (olusturma desc);
create index if not exists siparisler_durum_idx on siparisler (durum);

-- Canlı güncelleme (mutfak paneli anında görsün)
-- Tablo zaten eklenmişse hata vermesin diye sarmalanmıştır: Supabase SQL Editor
-- tüm dosyayı tek parça çalıştırır, tek satır patlarsa HEPSİ geri alınır.
do $$
begin
  alter publication supabase_realtime add table siparisler;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- GÜVENLİK
-- ---------------------------------------------------------------------------
-- DİKKAT: anon key statik sitede herkese görünür. Aşağıdaki kurallar
-- "tek işletme, herkes sipariş verebilir" senaryosu içindir.
--
-- Bu haliyle teknik bilgisi olan biri:
--   · başka masaların siparişlerini okuyabilir
--   · sahte sipariş oluşturabilir
--   · sipariş durumunu değiştirebilir
--
-- Küçük bir büfede pratikte sorun çıkarmaz (mutfak zaten her siparişi görüyor),
-- ama BİRDEN FAZLA İŞLETMEYE satmadan önce şunlar şart:
--   · her işletme için ayrı isletme_id kolonu + o kolona göre RLS
--   · durum güncellemesini yalnızca giriş yapmış personele açmak
--     (mutfak paneli Supabase Auth ile korunur)
--   · sipariş oluşturmayı hız sınırına bağlamak (Edge Function)
-- ---------------------------------------------------------------------------

alter table siparisler enable row level security;

-- Müşteri sipariş oluşturabilsin
drop policy if exists "herkes siparis olusturabilir" on siparisler;
create policy "herkes siparis olusturabilir"
  on siparisler for insert
  to anon
  with check (true);

-- Mutfak paneli ve müşteri kendi siparişini görebilsin
drop policy if exists "herkes okuyabilir" on siparisler;
create policy "herkes okuyabilir"
  on siparisler for select
  to anon
  using (true);

-- Mutfak durumu güncelleyebilsin
-- (Personel girişi eklendiğinde "to anon" yerine "to authenticated" yap)
drop policy if exists "herkes durum guncelleyebilir" on siparisler;
create policy "herkes durum guncelleyebilir"
  on siparisler for update
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- SİLME İZNİ — bilerek KAPALI bırakıldı
-- ---------------------------------------------------------------------------
-- Silme kuralı olmadığı için paneldeki "Demo siparişlerini sil" düğmesi
-- supabase modunda "silme izni yok" uyarısı verir. Doğru davranış budur:
-- siparişleri internetten herkesin silebilmesi istenmez.
--
-- Test kayıtlarını temizlemek için Supabase panelini kullan:
--   Table Editor → siparisler → satırları seç → Delete
--
-- Düğmenin TÜM siparişler için çalışmasını istiyorsan aşağıdaki üç satırı aç.
-- Gerçek servise geçmeden önce mutlaka geri kapat.
--
-- create policy "herkes silebilir"
--   on siparisler for delete
--   to anon using (true);


-- ---------------------------------------------------------------------------
-- DEMO MASASI — satış görüşmesi için
-- ---------------------------------------------------------------------------
-- demo.html sayfası masa numarası olarak 'DEMO' kullanır. Aşağıdaki kural
-- yalnızca o masanın siparişlerinin silinmesine izin verir; gerçek masaların
-- siparişlerine dokunulamaz. Güvenli, açık bırakılabilir.
drop policy if exists "demo siparisleri silinebilir" on siparisler;
create policy "demo siparisleri silinebilir"
  on siparisler for delete
  to anon
  using (masa = 'DEMO');

-- ---------------------------------------------------------------------------
-- Eski siparişleri temizleme (isteğe bağlı)
-- Supabase → Database → Cron ile günlük çalıştırabilirsin.
-- ---------------------------------------------------------------------------
-- delete from siparisler where olusturma < now() - interval '7 days';
