# parfumbilgisi.com

Next.js 15 · Supabase (Postgres + Storage) · Vercel

## Omurga

| | Nasıl |
|---|---|
| **Hız** | Sayfalar ilk ziyarette üretilir, 1 gün CDN'de cache'lenir (ISR). JavaScript'siz arama, reklam/izleyici yok, görseller lazy-load. Tüm sorgular indexli. |
| **Güvenlik** | Site veritabanını yalnızca okuyabilir (RLS). Yükleme fonksiyonu ve geçici tablo dışarıya kapalı. Anahtarlar sadece sunucuda. Sıkı CSP (sadece kendi görsel depomuz), HSTS, clickjacking koruması. URL girdileri veritabanına gitmeden doğrulanır. |
| **SEO** | Temiz URL'ler, Product + Breadcrumb şeması, canonical, nota/aile/marka hub sayfaları, bilgisi az sayfalar `noindex`, sitemap parçaları, arama sayfaları index dışı. |

## Sayfalar
`/` · `/parfum/[slug]` · `/marka/[slug]` · `/markalar` · `/nota/[slug]` · `/aile/[slug]` · `/notalar` · `/ara`

## Kurulum sırası
1. **Supabase**: yeni proje (bölge: Frankfurt / eu-central-1) → SQL Editor → `supabase/01-kurulum.sql` → Run
2. **Veri** (Termux): `export DB_URL='...'` → `bash scripts/veri-yukle.sh`
3. **Görseller** (Termux): `export SUPABASE_URL=... SERVICE_KEY=...` → `bash scripts/gorsel-yukle.sh`
4. **GitHub**: repoya push
5. **Vercel**: import → `SUPABASE_URL`, `SUPABASE_ANON_KEY` ekle → Deploy → alan adı

## Veri güncelleme
Yeni CSV ile `scripts/veri-yukle.sh` tekrar çalıştırılır; var olanlar güncellenir, yeniler eklenir, siteye 1 gün içinde yansır.

## Kural
`lib/format.ts` içindeki `slugify` ile `01-kurulum.sql` içindeki `public.slugify` birebir aynı olmalı.
