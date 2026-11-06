import { fold, hueOf } from "./format";

/*
 * Akor adından renk (Türkçe ve İngilizce adlar). İlk eşleşen kazanır.
 * Tanınmayan akorlar için addan sabit bir ton üretilir; her akorun rengi hep aynı kalır.
 */
const COLORS: [RegExp, string][] = [
  [/vanil/, "#d8a93c"],
  [/karamel|caramel|bal\b|honey|sekerli|sugar/, "#c98a3a"],
  [/cikolata|chocolate|kakao|cocoa/, "#6a4330"],
  [/kahve|coffee/, "#53392b"],
  [/tatli|sweet|gurme|gourmand/, "#d1604a"],
  [/amber|kehribar|balsam/, "#c47a2c"],
  [/baharat|spic|aci\b|biber|pepper/, "#b8352c"],
  [/patchouli|paculi/, "#7b5a3a"],
  [/oud|\bud\b/, "#5e3b2a"],
  [/deri|leather/, "#6e4030"],
  [/tutun|tobacco/, "#80501f"],
  [/duman|smok|tutsu/, "#6c6c72"],
  [/odun|wood|sedir|cedar|sandal/, "#8d5e3d"],
  [/toprak|earth|kok\b/, "#7e6c4b"],
  [/yosun|moss|sipr|chypre/, "#6d8138"],
  [/yesil|green|cimen/, "#4f9a56"],
  [/aromatik|aromatic|otsu|herb/, "#5f9070"],
  [/lavanta|lavender/, "#9b7fc6"],
  [/narenciye|citrus|limon|lemon|bergamot|portakal/, "#e6b422"],
  [/tropik|tropical/, "#ee9a3a"],
  [/meyve|fruit/, "#e3604f"],
  [/gul\b|rose|\bgul/, "#d6507a"],
  [/beyaz cicek|white floral|yasemin|jasmin|tuberoz/, "#e7a7bd"],
  [/cicek|floral|flower/, "#e08aa6"],
  [/pudra|powder/, "#d6b3c9"],
  [/misk|musk|animal|hayvan/, "#b79aa9"],
  [/sucul|aquatic|marine|deniz|ozon|water/, "#3d9bd1"],
  [/taze|fresh|ferah|temiz|soap|sabun/, "#5fc3c0"],
  [/tuzlu|salty|mineral/, "#8db5c8"],
  [/metal/, "#9aa3ab"],
  [/alkol|rum|whisk|konyak|cognac|sarap|wine/, "#a9663a"],
  [/findik|ceviz|nut|badem|almond/, "#a67c52"],
];

export function accordColor(name: string): string {
  const t = fold(name);
  for (const [re, c] of COLORS) if (re.test(t)) return c;
  return `hsl(${hueOf(t)} 42% 48%)`;
}
