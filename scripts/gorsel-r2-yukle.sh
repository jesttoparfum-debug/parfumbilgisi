#!/data/data/com.termux/files/usr/bin/bash
# Görselleri Cloudflare R2'deki "parfum" kovasına yükler (rclone ile).
# Kaldığı yerden devam eder: yarıda kesilirse aynı komutu tekrar çalıştır, olanları atlar.
#
# Önce Termux'ta bir kez:   pkg install rclone
# Sonra:                     bash scripts/gorsel-r2-yukle.sh
# Anahtarlar sorulur; dosyaya yazılmaz, Termux'u kapatınca silinir. Kimseyle paylaşma.
set -uo pipefail

DIR="${1:-$HOME/pb-temiz/images}"
ACCOUNT_ID="${R2_ACCOUNT_ID:-264c2880ddd41464c42e0926716dc838}"
[ -d "$DIR" ] || { echo "Klasor yok: $DIR"; exit 1; }
command -v rclone >/dev/null || { echo "Once: pkg install rclone"; exit 1; }

read -r -p "R2 Access Key ID: " AK
read -r -s -p "R2 Secret Access Key (yazarken gorunmez): " SK; echo

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$AK"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$SK"
export RCLONE_CONFIG_R2_ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

echo "Dosya sayisi: $(ls "$DIR" | wc -l)"
rclone copy "$DIR" r2:parfum \
  --include "*.webp" --include "*.jpg" --include "*.jpeg" --include "*.png" \
  --transfers 6 --checkers 12 --retries 5 \
  --header-upload "Cache-Control: public, max-age=31536000" \
  --stats 30s --stats-one-line -v 2>&1 | tail -n 40
echo "Bitti. Kontrol: rclone size r2:parfum"
rclone size r2:parfum
