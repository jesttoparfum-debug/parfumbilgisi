import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Koşulları ve Veri Kullanım Politikası",
  description:
    "Parfüm Bilgisi kullanım koşulları: otomatik veri toplama, kazıma, yapay zekâ eğitimi ve içeriğin yeniden yayınlanması yasaktır.",
  alternates: { canonical: "/kullanim-kosullari" },
};

const EPOSTA = "parfumbilgisi@gmail.com";
const GUNCELLEME = "6 Kasım 2026";

export default function Terms() {
  return (
    <article className="wrap section legal">
      <header className="page-head">
        <p className="eyebrow">Yasal</p>
        <h1>Kullanım Koşulları ve Veri Kullanım Politikası</h1>
        <p className="lead">Son güncelleme: {GUNCELLEME}</p>
      </header>

      <div className="legal__box">
        <strong>Özetle:</strong> Siteyi kişisel olarak gezebilir, okuyabilir ve sayfalara bağlantı verebilirsin.
        Sitedeki verileri otomatik araçlarla toplamak, kopyalamak, yapay zekâ eğitiminde kullanmak veya başka
        bir yerde yayınlamak <strong>yazılı izin olmadan kesinlikle yasaktır.</strong>
      </div>

      <section>
        <h2>1. Taraflar ve kabul</h2>
        <p>
          Bu koşullar parfumbilgisi.com alan adı altında yayınlanan web sitesi (&quot;Site&quot;) için geçerlidir.
          Siteye erişen veya Siteyi kullanan herkes (&quot;Kullanıcı&quot;) bu koşulları okumuş ve kabul etmiş
          sayılır. Koşulları kabul etmiyorsan Siteyi kullanmamalısın.
        </p>
      </section>

      <section>
        <h2>2. Korunan içerik</h2>
        <p>Aşağıdakiler Site işletmecisinin emeğinin ürünüdür ve yasal koruma altındadır:</p>
        <ul>
          <li>Sitenin tasarımı, görünümü, yazılımı ve kaynak kodu,</li>
          <li>Verilerin seçilmesi, düzenlenmesi, sınıflandırılması ve birbirine bağlanmasıyla oluşan derleme ve veri tabanı yapısı,</li>
          <li>Sitede üretilen özgün açıklama metinleri, sıralamalar ve şişe illüstrasyonları.</li>
        </ul>
        <p>
          Bu unsurlar 5846 sayılı Fikir ve Sanat Eserleri Kanunu, 6102 sayılı Türk Ticaret Kanunu&apos;nun haksız rekabet
          hükümleri ve ilgili mevzuat kapsamında korunur. Marka adları, logolar ve ürün adları ilgili sahiplerine aittir;
          Sitede yalnızca bilgilendirme amacıyla anılır.
        </p>
      </section>

      <section>
        <h2>3. İzin verilen kullanım</h2>
        <ul>
          <li>Siteyi bir web tarayıcısıyla, kişisel ve ticari olmayan amaçlarla gezmek ve okumak,</li>
          <li>Site sayfalarına bağlantı (link) vermek,</li>
          <li>Kaynak gösterip bağlantı vererek, tek bir parfüm hakkında kısa alıntı yapmak,</li>
          <li>Genel arama motorlarının (Google, Bing, Yandex vb.) Siteyi arama sonuçlarında göstermek amacıyla dizine eklemesi.</li>
        </ul>
      </section>

      <section>
        <h2>4. Kesinlikle yasak olan kullanım</h2>
        <p>Yazılı izin olmaksızın aşağıdakiler yasaktır:</p>
        <ul>
          <li>Bot, örümcek, kazıyıcı (scraper), komut dosyası veya benzeri otomatik araçlarla Siteden veri toplamak, indirmek ya da kopyalamak,</li>
          <li>Sitedeki verilerin tamamını veya önemli bir kısmını (tek seferde ya da parça parça, sistematik olarak) çoğaltmak, çıkarmak veya yeniden kullanmak,</li>
          <li>Site içeriğini yapay zekâ veya makine öğrenmesi modellerinin eğitiminde, ince ayarında ya da değerlendirilmesinde kullanmak,</li>
          <li>Site içeriğini başka bir web sitesinde, uygulamada, veri setinde veya üründe yayınlamak, satmak ya da dağıtmak,</li>
          <li>Siteyi çerçeve (iframe) içinde göstermek veya Site içeriğini kendi içeriğinmiş gibi sunmak,</li>
          <li>Erişim sınırlarını, güvenlik önlemlerini veya teknik engelleri aşmaya ya da devre dışı bırakmaya çalışmak,</li>
          <li>Siteye, olağan kullanımı aşan sıklıkta istek göndererek hizmeti yavaşlatmak veya aksatmak.</li>
        </ul>
      </section>

      <section>
        <h2>5. Metin ve veri madenciliği hakkının saklı tutulması</h2>
        <p>
          Site işletmecisi, Sitedeki içerik üzerinde metin ve veri madenciliğine (text and data mining) ilişkin
          tüm haklarını açıkça saklı tutar. Bu çekince Sitenin her sayfasında makine tarafından okunabilir biçimde
          (<code>tdm-reservation</code> başlığı ve <code>/.well-known/tdmrep.json</code> dosyası) ve{" "}
          <code>robots.txt</code> dosyasında da bildirilmektedir.
        </p>
      </section>

      <section>
        <h2>6. İhlal hâlinde</h2>
        <p>
          Bu koşulları ihlal eden erişimler önceden bildirim yapılmaksızın engellenebilir. Site işletmecisi, ihlal
          nedeniyle doğan zararların tazmini dâhil olmak üzere tüm yasal haklarını saklı tutar.
        </p>
      </section>

      <section>
        <h2>7. Bilgilerin doğruluğu</h2>
        <p>
          Sitedeki bilgiler genel bilgilendirme amaçlıdır ve çeşitli kaynaklardan derlenmiştir. Doğruluğu, güncelliği
          ve eksiksizliği garanti edilmez. Bir ürün hakkında kesin bilgi için üreticiye veya satıcıya başvurulmalıdır.
          Sitede satış yapılmaz.
        </p>
      </section>

      <section>
        <h2>8. Gizlilik</h2>
        <p>
          Sitede üyelik yoktur; ad, e-posta gibi kişisel bilgiler istenmez ve toplanmaz. Reklam veya izleme çerezi
          kullanılmaz. Barındırma hizmeti sağlayıcısı, güvenlik ve hizmetin işletilmesi amacıyla IP adresi ve tarayıcı
          bilgisi gibi teknik kayıtları sınırlı süreyle tutabilir. Bu kayıtlar 6698 sayılı Kişisel Verilerin Korunması
          Kanunu&apos;na uygun olarak, yalnızca bu amaçlarla işlenir.
        </p>
      </section>

      <section>
        <h2>9. Hak ihlali bildirimi</h2>
        <p>
          Sitedeki bir içeriğin size ait bir hakkı ihlal ettiğini düşünüyorsanız, ilgili sayfa adresini ve
          açıklamanızı <a href={`mailto:${EPOSTA}`}>{EPOSTA}</a> adresine gönderin. Bildirimler incelenir ve
          gerekli görülen içerik kaldırılır.
        </p>
      </section>

      <section>
        <h2>10. İzin talepleri, değişiklikler ve iletişim</h2>
        <p>
          Verilerin herhangi bir şekilde kullanımı için yazılı izin taleplerini{" "}
          <a href={`mailto:${EPOSTA}`}>{EPOSTA}</a> adresine iletebilirsin. Bu koşullar önceden bildirim yapılmaksızın
          güncellenebilir; güncel metin her zaman bu sayfada yayımlanır. Bu koşullar Türkiye Cumhuriyeti
          kanunlarına tabidir.
        </p>
      </section>

      <p className="legal__back">
        <Link href="/">← Ana sayfaya dön</Link>
      </p>
    </article>
  );
}
