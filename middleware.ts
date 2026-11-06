import { NextResponse, type NextRequest } from "next/server";

/*
 * Kapı görevlisi: kazıma araçlarını ve izin verilmeyen veri/yapay zekâ botlarını reddeder.
 * Google, Bing, Yandex, DuckDuckGo gibi arama motorları ETKİLENMEZ (SEO korunur).
 * Not: Kendini normal tarayıcı gibi gösteren kararlı bir kazıyıcıyı tek başına durduramaz;
 * amatör araçları ve toplu botları keser.
 */
const ENGELLI = new RegExp(
  [
    // Programlama kütüphaneleri ve komut satırı araçları
    "python", "curl", "wget", "scrapy", "httpx", "aiohttp", "axios", "node-fetch", "undici",
    "go-http", "okhttp", "java/", "libwww", "perl", "ruby", "php/", "guzzle", "httpclient",
    "headlesschrome", "phantomjs", "selenium", "puppeteer", "playwright", "colly", "jsdom",
    // Site kopyalama programları
    "httrack", "webcopier", "sitesucker", "offline explorer", "teleport", "webzip", "wget",
    // Yapay zekâ eğitim ve veri toplama botları
    "gptbot", "chatgpt-user", "oai-searchbot", "ccbot", "claudebot", "claude-web", "anthropic-ai",
    "bytespider", "perplexitybot", "amazonbot", "meta-externalagent", "facebookbot", "omgili",
    "diffbot", "cohere-ai", "ai2bot", "youbot", "imagesiftbot", "timpibot", "applebot-extended",
    // Veri satan / SEO veri toplayıcıları
    "dataforseo", "mj12bot", "semrushbot", "ahrefsbot", "dotbot", "blexbot", "petalbot",
    "serpstatbot", "barkrowler", "megaindex", "seekport",
  ]
    .map((s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))
    .join("|"),
  "i",
);

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.length < 12 || ENGELLI.test(ua)) {
    return new NextResponse(
      "Erisim reddedildi. Otomatik veri toplama yasaktir: https://parfumbilgisi.com/kullanim-kosullari",
      { status: 403, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } },
    );
  }
  return NextResponse.next();
}

export const config = {
  // Statik dosyalar (CSS/JS/ikon) hariç tüm sayfalar
  matcher: ["/((?!_next/static|_next/image|icon\\.svg|favicon\\.ico).*)"],
};
