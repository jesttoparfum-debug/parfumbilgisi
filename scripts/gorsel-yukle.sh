#!/data/data/com.termux/files/usr/bin/bash
# Görselleri Supabase Storage'daki "parfum" kovasına yükler.
# Kaldığı yerden devam edebilir: yarıda kesilirse tekrar çalıştır.
#
# Kullanım (Termux):
#   export SUPABASE_URL='https://XXXX.supabase.co'
#   export SERVICE_KEY='...'   # Supabase > Project Settings > API Keys > secret / service_role
#   bash scripts/gorsel-yukle.sh
#
# UYARI: SERVICE_KEY tam yetkili anahtardır. Hiçbir dosyaya yazma, kimseyle paylaşma,
# GitHub'a koyma. İş bitince Termux'u kapatman yeterli, anahtar bellekten silinir.
set -uo pipefail

DIR="${1:-$HOME/pb-temiz/images}"
: "${SUPABASE_URL:?SUPABASE_URL tanimli degil}"
: "${SERVICE_KEY:?SERVICE_KEY tanimli degil}"
DONE="$HOME/.gorsel-yuklendi.txt"; touch "$DONE"

cd "$DIR" || { echo "Klasor yok: $DIR"; exit 1; }
total=$(ls | wc -l); n=0; ok=0; err=0
for f in *; do
  n=$((n + 1))
  grep -qxF "$f" "$DONE" && continue
  case "$f" in
    *.webp) ct=image/webp ;;
    *.jpg|*.jpeg) ct=image/jpeg ;;
    *.png) ct=image/png ;;
    *) continue ;;
  esac
  if curl -sf -X POST "$SUPABASE_URL/storage/v1/object/parfum/$f" \
       -H "Authorization: Bearer $SERVICE_KEY" -H "apikey: $SERVICE_KEY" \
       -H "x-upsert: true" -H "Cache-Control: max-age=31536000" \
       -H "Content-Type: $ct" --data-binary @"$f" >/dev/null; then
    echo "$f" >> "$DONE"; ok=$((ok + 1))
  else
    err=$((err + 1)); echo "HATA: $f"
  fi
  [ $((n % 100)) -eq 0 ] && echo "$n / $total"
done
echo "Bitti. Yuklenen: $ok, hata: $err, toplam: $total"
