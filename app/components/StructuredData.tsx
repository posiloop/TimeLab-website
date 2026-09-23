import { COMPANY, SITE_URL } from "../data/site";
import { getFaqItems } from "../server/content/faq";
import { SOCIAL_LINKS } from "../data/links";
import { STORES } from "../data/stores";

/** 搜尋引擎用的結構化資料，不影響畫面。
    內容一律取自站上既有的資料檔，避免與顯示的文字不一致 */
export default async function StructuredData() {
  // 與畫面的 Accordion 呼叫同一個函式，確保搜尋結果不會顯示與網頁不符的答案
  const faqItems = await getFaqItems();

  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: COMPANY.name,
      legalName: COMPANY.legalName,
      taxID: COMPANY.taxId,
      url: SITE_URL,
      logo: `${SITE_URL}/images/brand/logo.png`,
      telephone: COMPANY.phone,
      sameAs: [
        ...SOCIAL_LINKS.filter((l) => l.id !== "form").map((l) => l.href),
        "https://www.threads.com/@timelab_tw_",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: COMPANY.name,
      inLanguage: "zh-Hant-TW",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    // 兩家實體門市 —— 在地搜尋（如「台中 拍貼機」）的主要依據
    ...STORES.map((store) => {
      const [opens, closes] = store.hours.split("~");
      return {
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#store-${store.name}`,
        name: `${COMPANY.name} ${store.name}`,
        image: `${SITE_URL}${store.image}`,
        address: { "@type": "PostalAddress", streetAddress: store.address, addressCountry: "TW" },
        telephone: COMPANY.phone,
        hasMap: store.mapUrl,
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens,
          closes,
        },
      };
    }),
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // JSON.stringify 的輸出不含未跳脫的 </script，可安全插入
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
