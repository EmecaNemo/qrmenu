-- ============================================================================
-- SİPARİŞ SİSTEMİ — Supabase kurulumu
-- ============================================================================
-- Bunu Supabase panelinde SQL Editor'e yapıştırıp çalıştır.
-- Sonra siparis-servisi.js içindeki SiparisAyar bloğuna url + anonKey gir
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
alter publication supabase_realtime add table siparisler;

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
-- Eski siparişleri temizleme (isteğe bağlı)
-- Supabase → Database → Cron ile günlük çalıştırabilirsin.
-- ---------------------------------------------------------------------------
-- delete from siparisler where olusturma < now() - interval '7 days';
