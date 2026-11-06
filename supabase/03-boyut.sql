-- Veritabanı boyutu (ücretsiz plan sınırı: 500 MB)
select pg_size_pretty(pg_database_size(current_database())) as toplam_boyut;
select relname as tablo, pg_size_pretty(pg_total_relation_size(c.oid)) as boyut
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'm')
order by pg_total_relation_size(c.oid) desc limit 6;
