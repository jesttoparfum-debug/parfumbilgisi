#!/data/data/com.termux/files/usr/bin/bash
# parfumbilgisi.com — tek komutla güncelleme
#
# Kullanım (Termux, bu satırı TEK BAŞINA yapıştır):
#   bash ~/pb-site/scripts/guncelle.sh /sdcard/Download/PAKET.zip
#
# Yaptıkları: paketi açar -> şifre ister -> veritabanı boyutunu kontrol eder ->
# veritabanını günceller -> yıl/parfümör ekler -> siteyi GitHub'a gönderir -> şifreyi siler.
# Bir adımda hata olursa durur ve nedenini yazar.

set -uo pipefail

SITE="$HOME/pb-site"
PAKET="${1:-}"
ZEN="$HOME/pb-temiz/zenginlestirme.csv"
LOG="$HOME/.guncelle-son.log"
SINIR_MB=400   # ücretsiz plan 500 MB; güvenlik payı

export PGHOST="${PGHOST:-aws-0-eu-west-2.pooler.supabase.com}" PGPORT="${PGPORT:-6543}" PGDATABASE="${PGDATABASE:-postgres}"
export PGUSER="${PGUSER:-postgres.wnkulmjbvrrrnuwmsasz}" PGSSLMODE="${PGSSLMODE:-require}" PGCONNECT_TIMEOUT=20

dur()  { echo; echo "!!! DURDU: $1"; echo "    Ayrinti: $LOG"; unset PGPASSWORD; exit 1; }
adim() { echo; echo "== $1"; }
: > "$LOG"

adim "1/6 Paket aciliyor"
[ -n "$PAKET" ] && [ -f "$PAKET" ] || dur "Paket bulunamadi: '$PAKET'"
unzip -oq "$PAKET" -d "$SITE" >>"$LOG" 2>&1 || dur "Paket acilamadi"
echo "   $(basename "$PAKET") acildi"

adim "2/6 Veritabanina baglaniliyor"
command -v psql >/dev/null || pkg install -y postgresql >>"$LOG" 2>&1
if [ -z "${PGPASSWORD:-}" ]; then
  read -rp "   Sifre: " PGPASSWORD; export PGPASSWORD
  printf '\033[1A\033[2K'   # şifrenin yazıldığı satırı ekrandan sil
fi
psql -qtAc "select 1" >>"$LOG" 2>&1 || dur "Baglanilamadi (sifre yanlis ya da internet yok)"
BOYUT=$(psql -qtAc "select pg_database_size(current_database())/1048576")
echo "   Baglandi. Veritabani boyutu: ${BOYUT} MB / 500 MB"
[ "$BOYUT" -lt "$SINIR_MB" ] || dur "Veritabani ${SINIR_MB} MB'i asti. Guncellemeden once yer acmamiz lazim."

adim "3/6 Veritabani guncelleniyor (1-3 dakika surebilir, bekle)"
if ! psql -q -v ON_ERROR_STOP=1 -f "$SITE/supabase/01-kurulum.sql" >>"$LOG" 2>&1; then
  echo "   Hata mesaji:"; grep -E "ERROR|HATA" -A3 "$LOG" | head -8 | sed 's/^/   /'
  dur "Veritabani guncellemesi basarisiz (hicbir sey yarim kalmadi, tekrar denenebilir)"
fi
echo "   Tamam"

if [ -f "$ZEN" ]; then
  adim "4/6 Cikis yili ve parfumorler ekleniyor"
  if ! psql -q -v ON_ERROR_STOP=1 >>"$LOG" 2>&1 <<SQL
begin;
set local statement_timeout = 0;
truncate public.staging_enrich;
\copy public.staging_enrich(slug,year,perfumers,concentration) from '$ZEN' with (format csv, header true)
commit;
begin;
set local statement_timeout = 0;
select public.zenginlestir_uygula();
commit;
SQL
  then
    grep -E "ERROR" -A3 "$LOG" | head -6 | sed 's/^/   /'
    dur "Zenginlestirme basarisiz"
  fi
  psql -qtAc "select count(*) filter (where year is not null) || ' yilli, ' || count(*) filter (where cardinality(perfumers) > 0) || ' parfumorlu parfum' from public.perfumes" | sed 's/^/   /'
else
  adim "4/6 Zenginlestirme dosyasi yok, atlaniyor"
fi

BOYUT=$(psql -qtAc "select pg_database_size(current_database())/1048576")
echo "   Veritabani boyutu simdi: ${BOYUT} MB / 500 MB"

adim "5/6 Site GitHub'a gonderiliyor"
cd "$SITE" || dur "Proje klasoru yok"
git add -A >>"$LOG" 2>&1
if git diff --cached --quiet; then
  echo "   Kodda degisiklik yok"
else
  git commit -qm "Guncelleme $(date '+%Y-%m-%d %H:%M')" >>"$LOG" 2>&1 || dur "Kayit (commit) yapilamadi"
  git push -q >>"$LOG" 2>&1 || dur "GitHub'a gonderilemedi"
  echo "   Gonderildi. Vercel siteyi 2-3 dakikada gunceller."
fi

adim "6/6 Temizlik"
unset PGPASSWORD
echo "   Sifre bellekten silindi"
echo
echo "TAMAM ✓"
