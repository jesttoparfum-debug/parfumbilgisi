import type { Guide } from "@/lib/guides";

export const parfumNedir: Guide = {
  slug: "parfum-nedir",
  title: "Parfüm nedir? Neyden oluşur, nasıl yapılır?",
  description:
    "Parfüm nedir, neyden yapılır? Koku yağı, alkol ve sabitleyiciden hammaddelerin elde edilmesine kadar parfümün nasıl yapıldığını sade bir dille anlatıyoruz.",
  category: "Temel bilgiler",
  published: "2026-11-06",
  updated: "2026-11-06",
  summary: [
    "Parfüm; koku veren maddelerin (koku yağı ya da esans) çoğunlukla alkol ve suyla seyreltilmesiyle elde edilen karışımdır.",
    "Bir formülde onlarca, bazen yüzlerce bileşen bulunur. Doğal hammaddeler ve sentetik moleküller birlikte kullanılır.",
    "Karışım dinlendirilir, süzülür ve şişelenir. İçindeki koku yağı oranına göre EDP, EDT gibi adlar alır.",
  ],
  body: [
    { t: "h2", x: "Parfüm tam olarak nedir?" },
    {
      t: "p",
      x: "Parfüm, bir kokuyu cildin ya da kumaşın üzerinde kontrollü biçimde yayması için hazırlanmış sıvı bir karışımdır. Ortada tek bir “koku maddesi” yoktur. Parfümör denen uzmanlar, birbirine uyan onlarca hatta yüzlerce bileşeni belli oranlarda bir araya getirir ve ortaya tek bir izlenim çıkar. Sürdüğün anda hissettiğin ilk ferahlık ile saatler sonra tenin üzerinde kalan sıcak iz aynı formülün farklı bileşenlerinden gelir.",
    },
    {
      t: "p",
      x: "Günlük dilde “parfüm” kelimesi iki anlamda kullanılır. Genel anlamıyla bütün kokulu sıvılar için söylenir. Dar anlamıyla ise en yüksek koku yağı oranına sahip türün adıdır. Aradaki farkı [EDP, EDT ve Extrait rehberimizde](/rehber/edp-edt-extrait-farki) ayrıntılı anlattık.",
    },
    { t: "h2", x: "Bir parfümün üç temel parçası" },
    {
      t: "ul",
      x: [
        "**Koku yağı (esans, konsantre):** Kokunun asıl kaynağı. Doğal özlerin ve sentetik moleküllerin karışımıdır.",
        "**Çözücü:** Koku yağını seyreltip ciltte kolayca dağılmasını sağlar. Çoğunlukla etil alkol ve su kullanılır. Bazı ürünlerde fraksiyone hindistan cevizi yağı gibi nötr yağlar ya da jojoba gibi mumlar da çözücü görevi görür.",
        "**Sabitleyiciler:** Kokunun daha yavaş uçmasına ve daha dengeli durmasına yardım eder. Reçineler, amber bazlar ve bazı odunsu moleküller bu iş için kullanılır.",
      ],
    },
    {
      t: "note",
      x: "Parfümün şişesindeki sıvının büyük bölümü çoğu zaman alkoldür. Koku yağının oranı, parfümün hangi türe girdiğini belirler. Örneğin bir Eau de Parfum’de bu oran kabaca yüzde 15 ile 20 arasındadır.",
    },
    { t: "h2", x: "Hammaddeler nereden gelir?" },
    {
      t: "p",
      x: "Parfümde iki büyük hammadde ailesi vardır. Birincisi doğal kaynaklardır: çiçekler, meyve kabukları, kökler, odunlar, reçineler, baharatlar. İkincisi laboratuvarda üretilen sentetik moleküllerdir.",
    },
    {
      t: "p",
      x: "Sentetik maddeler 19. yüzyılın sonlarından beri parfümcülüğün parçası. Vanilin ve kumarin gibi moleküller, doğal malzemelerle yapılması çok zor ya da çok pahalı kokuların kapısını açtı. Bugün birçok klasik parfümün kurgusu doğal ve sentetik malzemelerin birlikte çalışmasına dayanır. Üstelik bazı kokular, örneğin deniz esintisini çağrıştıran “akuatik” notalar, sentetik moleküller olmadan neredeyse hiç yapılamaz.",
    },
    {
      t: "p",
      x: "Kısacası “doğal iyi, sentetik kötü” gibi basit bir ayrım yoktur. Doğal özler de güçlü alerjenler içerebilir; sentetik moleküller de çoğu zaman güvenle ve tutarlı biçimde kullanılır. Alerjiyle ilgili ayrıntılar için [parfüm alerjisi yazımıza](/rehber/parfum-alerjisi) bakabilirsin.",
    },
    { t: "h2", x: "Doğal hammaddeler nasıl elde edilir?" },
    {
      t: "p",
      x: "Bir çiçeğin ya da bir kökün kokusunu şişeye taşımanın birkaç yolu var. Hangi yöntemin seçileceği malzemenin ne kadar hassas olduğuna bağlıdır.",
    },
    {
      t: "table",
      caption: "Parfümcülükte kullanılan başlıca özüt alma yöntemleri",
      head: ["Yöntem", "Ne elde edilir?", "Tipik malzemeler"],
      rows: [
        ["Sıkma (soğuk basınç)", "Esans", "Bergamot, limon, portakal, mandalina kabuğu"],
        ["Buhar distilasyonu", "Uçucu yağ ve çiçek suyu", "Lavanta, sedir, sandal, kökler, tohumlar, gül, turunç çiçeği"],
        ["Çözücü ile özüt alma", "Konkret, rezinoid ve absolü", "Yasemin, tüberoz, meşe yosunu, vanilya, reçineler"],
        ["Enfleraj (yağda emdirme)", "Pomat, ardından absolü", "Yasemin, tüberoz, gardenya, menekşe"],
        ["CO₂ ile özüt alma", "CO₂ özütü", "Baharatlar, kökler, reçineler, kuru bitkiler"],
      ],
    },
    {
      t: "p",
      x: "Buhar distilasyonunda bitki malzemesi kaynayan suyun üzerinde bir ızgaraya konur ve yalnızca buharla temas eder. Bu yöntem dayanıklı malzemeler için uygundur. Yasemin gibi hassas çiçekler ise ısıdan zarar gördüğü için çözücü ya da CO₂ yöntemiyle işlenir. Çözücü yönteminde önce “konkret” elde edilir, ardından alkolle mumlardan ayrılarak “absolü” hazırlanır. Bu yüzden gül absolüsü, gül uçucu yağına göre daha derin ve bal gibi kokar.",
    },
    {
      t: "p",
      x: "Enfleraj, çiçeklerin kokusunu kokusuz bir yağ tabakasına emdirme yöntemidir. Çok emek isteyen bu yöntem bugün nadiren kullanılıyor. Bir kilogram yasemin için yaklaşık 8.000 çiçeğin elle toplanması gerekebildiği için pahalıdır.",
    },
    {
      t: "note",
      x: "Doğal özler çok az çıkar. Yaklaşık 3.500 ile 5.000 kilogram şam gülü yaprağından yalnızca 1 kilogram gül yağı elde edilir. Yaklaşık 1.000 kilogram turunç çiçeğinden ise 1 kilogram neroli yağı çıkar. Bu rakamlar, doğal malzemelerin neden pahalı olduğunu açıklar.",
    },
    { t: "h2", x: "Formül nasıl kurulur?" },
    {
      t: "p",
      x: "Parfümör formülü kurarken hammaddeleri birbirine bağlayan bir iskelet düşünür. Bazı bileşenler ana karakteri verir, bazıları köşeleri yumuşatır, bazıları ise kokunun kalıcı olmasını sağlar. İki ya da daha fazla malzemenin birleşip tek bir izlenim oluşturmasına “akor” denir. Örneğin vanilya, tonka ve amber birlikte “sıcak ve tatlı” bir akor hissi verir. Akorları ve notaları [parfüm sözlüğünde](/rehber/parfum-sozlugu) bulabilirsin.",
    },
    {
      t: "p",
      x: "Formülün zamanla nasıl açılacağı da tasarımın parçasıdır. Hafif ve çabuk uçan malzemeler başta hissedilir, ağır ve kalıcı malzemeler sonradan öne çıkar. Buna [koku piramidi](/rehber/koku-piramidi) denir.",
    },
    { t: "h2", x: "Karıştırma, dinlendirme ve şişeleme" },
    {
      t: "p",
      x: "Koku yağları hazırlandıktan sonra etanol ve suyla karıştırılır. Karışım birkaç hafta dinlendirilir; bu sürede bileşenler birbirine alışır ve koku olgunlaşır. Ardından süzülerek şişelenir. Dinlenme süresi ve süzme, parfümün berrak ve dengeli olması için önemlidir.",
    },
    { t: "h2", x: "Parfüm sayfalarında ne görüyorsun?" },
    {
      t: "p",
      x: "Parfüm Bilgisi’ndeki her parfüm sayfasında üst, orta ve alt notaları, baskın akorları (yüzdeleriyle), koku ailesini ve varsa parfümörü görebilirsin. Bu bilgilerin hepsi bu yazıdaki kavramlara dayanır. İstediğin bir parfümü [arama sayfasından](/ara) bulabilir, sevdiğin notalardan yola çıkarak ise [Koku Bulucu](/bul) ile yeni kokular keşfedebilirsin.",
    },
  ],
  faq: [
    {
      q: "Parfümün içinde ne var?",
      a: "Koku yağı (doğal özler ve sentetik moleküller), çözücü (çoğunlukla alkol ve su) ve kokunun dengesini koruyan sabitleyiciler. Koku yağının oranı parfümün türünü belirler.",
    },
    {
      q: "Koku yağı ile parfüm aynı şey mi?",
      a: "Hayır. Koku yağı (esans) parfümün konsantre halidir ve genellikle seyreltilmeden sürülmez. Parfüm ise bu konsantrenin alkol ve suyla seyreltilmiş, sürmeye hazır halidir. Bazı markalar yağ bazlı, alkolsüz ürünler de satar.",
    },
    {
      q: "Doğal parfüm daha mı iyi?",
      a: "Her zaman değil. Doğal malzemeler pahalı ve zengindir ama alerjen de içerebilir. Sentetik moleküller ise tutarlıdır ve doğada bulunmayan kokular üretmeye imkân verir. Kaliteyi belirleyen, malzemelerin kaynağından çok formülün ustalığıdır.",
    },
  ],
  related: ["edp-edt-extrait-farki", "koku-piramidi", "parfum-tarihi"],
  sources: [
    { title: "Wikipedia: Perfume", url: "https://en.wikipedia.org/wiki/Perfume" },
    { title: "Scento: Extraction techniques in French perfumery", url: "https://www.scento.com/blog/extraction-techniques-french-perfumery" },
  ],
};
