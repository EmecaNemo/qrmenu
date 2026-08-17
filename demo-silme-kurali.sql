-- Demo masasının siparişlerini silme izni.
-- Supabase → SQL Editor → New query → bunu yapıştır → Run
-- Tekrar tekrar çalıştırılabilir, hata vermez.

drop policy if exists "demo siparisleri silinebilir" on public.siparisler;

create policy "demo siparisleri silinebilir"
on public.siparisler
for delete
to anon
using (masa = 'DEMO');
