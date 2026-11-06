#!/data/data/com.termux/files/usr/bin/bash
# Temiz CSV'yi Supabase'e yükler. Tekrar çalıştırmak güvenlidir (günceller, çoğaltmaz).
#
# Kullanım (Termux):
#   export DB_URL='postgresql://postgres.XXXX:SIFRE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
#   bash scripts/veri-yukle.sh
set -euo pipefail

CSV="${1:-$HOME/pb-temiz/parfumler.csv}"
: "${DB_URL:?DB_URL tanimli degil. Supabase > Connect > Session pooler adresini export DB_URL='...' ile gir.}"
[ -f "$CSV" ] || { echo "CSV bulunamadi: $CSV"; exit 1; }
command -v psql >/dev/null || pkg install -y postgresql

echo "Yukleniyor: $CSV ($(du -h "$CSV" | cut -f1))"
# Her adım tek bir işlem (transaction) içinde: 6543 (transaction pooler) portunda da güvenli çalışır.
psql "$DB_URL" -v ON_ERROR_STOP=1 -q <<SQL
\echo '1/2 CSV aktariliyor...'
begin;
set local statement_timeout = 0;
truncate public.staging_perfumes;
\copy public.staging_perfumes(slug,name,brand,gender,release_year,perfumers,top_notes,heart_notes,base_notes,accord_spectrum,family,season,image) from '$CSV' with (format csv, header true)
commit;
\echo '2/2 Veriler isleniyor (birkac dakika surebilir)...'
begin;
set local statement_timeout = 0;
select public.yukle_staging();
commit;
select count(*) as toplam,
       count(*) filter (where indexable) as google_icin_hazir,
       count(*) filter (where image is not null) as gorselli
from public.perfumes;
SQL
echo "Bitti."
