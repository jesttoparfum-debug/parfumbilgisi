// Robot: Wikidata'dan (CC0 lisanslı açık veri) parfüm adaylarını bulur, sitede olmayanları
// "candidates" tablosuna koyar. Hiçbir şeyi doğrudan yayınlamaz; onay yönetim panelinden verilir.
//
// Çalıştırma (GitHub Actions'ta otomatik): node scripts/robot/wikidata.mjs
// Gerekli ortam değişkenleri: SUPABASE_URL, SUPABASE_SERVICE_KEY
// İsteğe bağlı: PERFUME_QID (varsayılan Q131746), MAX_ROWS (varsayılan 20000), DRY_RUN=1
import process from "node:process";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const QID = process.env.PERFUME_QID || "Q131746";
const MAX = Number(process.env.MAX_ROWS || 20000);
const DRY = process.env.DRY_RUN === "1";
const UA = "parfumbilgisi-robot/1.0 (https://parfumbilgisi.com; parfumbilgisi@gmail.com)";

if (!DRY && (!URL_ || !KEY)) {
  console.error("SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli (ya da DRY_RUN=1).");
  process.exit(1);
}

const fold = (t) =>
  t.normalize("NFD").replace(/\p{M}/gu, "").replace(/ı/g, "i").replace(/İ/g, "i").toLowerCase().replace(/\s+/g, " ").trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sparql(offset, limit) {
  const q = `
SELECT ?item ?itemLabel ?brandLabel ?year ?perfumerLabel WHERE {
  { SELECT ?item WHERE { ?item wdt:P31 wd:${QID}. } ORDER BY ?item LIMIT ${limit} OFFSET ${offset} }
  OPTIONAL { ?item wdt:P176 ?brand. }
  OPTIONAL { ?item wdt:P571 ?inc. BIND(YEAR(?inc) AS ?year) }
  OPTIONAL { ?item wdt:P170 ?perfumer. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,tr,de,es,it". }
}`;
  for (let deneme = 1; deneme <= 3; deneme++) {
    const r = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q), {
      headers: { "user-agent": UA, accept: "application/sparql-results+json" },
    });
    if (r.ok) return (await r.json()).results.bindings;
    console.warn(`Wikidata ${r.status}, ${deneme}. deneme`);
    await sleep(5000 * deneme);
  }
  throw new Error("Wikidata yanıt vermedi");
}

async function rest(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      authorization: `Bearer ${KEY}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
}

// 1) Wikidata'dan çek, öğe başına birleştir
const items = new Map();
const PAGE = 2000;
for (let off = 0; off < MAX; off += PAGE) {
  const rows = await sparql(off, PAGE);
  if (rows.length === 0) break;
  for (const b of rows) {
    const id = b.item.value.split("/").pop();
    const name = b.itemLabel?.value;
    if (!name || /^Q\d+$/.test(name)) continue; // etiketi olmayan öğeleri atla
    const it = items.get(id) ?? { id, name, brand: null, year: null, perfumers: new Set() };
    if (b.brandLabel?.value && !/^Q\d+$/.test(b.brandLabel.value)) it.brand = b.brandLabel.value;
    if (b.year?.value && /^\d{4}$/.test(b.year.value)) it.year = Number(b.year.value);
    if (b.perfumerLabel?.value && !/^Q\d+$/.test(b.perfumerLabel.value)) it.perfumers.add(b.perfumerLabel.value);
    items.set(id, it);
  }
  console.log(`Wikidata: ${items.size} öğe (offset ${off})`);
  await sleep(1500);
}
console.log(`Toplam ${items.size} parfüm öğesi alındı.`);

// Örnek göster (ilk çalıştırmada doğru şeyleri çekip çekmediğimizi görmek için)
const list = [...items.values()];
for (const it of list.slice(0, 8)) console.log("örnek:", it.brand ?? "-", "|", it.name, "|", it.year ?? "-", "|", [...it.perfumers].join(", ") || "-");

if (DRY) {
  console.log("DRY_RUN: veritabanına yazılmadı.");
  process.exit(0);
}

// 2) Sitede zaten olanları ele (ad+marka tam eşleşme)
const withBrand = list.filter((i) => i.brand);
const yeni = [];
for (let i = 0; i < withBrand.length; i += 200) {
  const part = withBrand.slice(i, i + 200);
  const texts = part.map((p) => fold(`${p.brand} ${p.name}`));
  const var_ = new Set((await rest("rpc/var_mi", { method: "POST", body: JSON.stringify({ p_texts: texts }) })) ?? []);
  part.forEach((p, k) => {
    if (!var_.has(texts[k])) yeni.push(p);
  });
}
console.log(`Sitede olmayan: ${yeni.length} / ${withBrand.length} (markası bilinen)`);

// 3) Aday olarak kaydet (aynı kayıt ikinci kez eklenmez, reddedilenler geri gelmez)
let eklenen = 0;
for (let i = 0; i < yeni.length; i += 500) {
  const body = yeni.slice(i, i + 500).map((p) => ({
    source: "wikidata",
    source_id: p.id,
    source_url: `https://www.wikidata.org/wiki/${p.id}`,
    license: "CC0",
    name: p.name,
    brand: p.brand,
    year: p.year,
    perfumers: [...p.perfumers],
  }));
  await rest("candidates?on_conflict=source,source_id", {
    method: "POST",
    headers: { prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(body),
  });
  eklenen += body.length;
}
console.log(`Aday kuyruğuna gönderildi: ${eklenen} (yeni olanlar eklendi, var olanlar atlandı)`);
