-- 02: Cinsiyet tamamlama. 01-kurulum.sql tekrar çalıştırıldıktan SONRA çalıştır.
update public.perfumes set gender_kaynak = 'veri' where gender is not null and gender_kaynak is null;
select public.cinsiyet_tamamla() as isimden_tamamlanan;
refresh materialized view public.brands_mv;
select gender, gender_kaynak, count(*) from public.perfumes group by 1, 2 order by 1, 2;
