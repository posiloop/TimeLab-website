import SectionTitle from "../components/SectionTitle";
import { FAQ_ITEMS } from "../data/faq";

export default function Faq() {
  return (
    <section id="faq" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>常見問題</SectionTitle>

      <div className="flex flex-col items-center gap-[10px] pb-6">
        {FAQ_ITEMS.map((item) => (
          // 收合時高度 68px（僅露出問題列），展開後撐開顯示答案
          // 設計稿 State=Collapsed / Expanded 兩個 variant：
          // 收合為淡紫底、深灰字、向右箭頭；展開為白底加淡紫框、紫字、轉折箭頭
          <details
            key={item.question}
            className="group w-[800px] max-w-full rounded-[10px] border-[3px] border-transparent bg-brand-mist px-10 py-5 transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] open:border-brand-mist open:bg-white max-md:px-5"
          >
            <summary className="flex cursor-pointer list-none items-center gap-[10px] [&::-webkit-details-marker]:hidden">
              <span className="relative size-[30px] shrink-0">
                {/* 收合：直向右箭頭 */}
                <svg
                  viewBox="0 0 30 30"
                  fill="none"
                  aria-hidden
                  className="absolute inset-0 size-[30px] text-brand-ink transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-open:opacity-0"
                >
                  <path
                    d="M5 13.5C4.17157 13.5 3.5 14.1716 3.5 15C3.5 15.8284 4.17157 16.5 5 16.5V15V13.5ZM26.0607 16.0607C26.6464 15.4749 26.6464 14.5251 26.0607 13.9393L16.5147 4.3934C15.9289 3.80761 14.9792 3.80761 14.3934 4.3934C13.8076 4.97919 13.8076 5.92893 14.3934 6.51472L22.8787 15L14.3934 23.4853C13.8076 24.0711 13.8076 25.0208 14.3934 25.6066C14.9792 26.1924 15.9289 26.1924 16.5147 25.6066L26.0607 16.0607ZM5 15V16.5H25V15V13.5H5V15Z"
                    fill="currentColor"
                  />
                </svg>
                {/* 展開：往右下轉折的箭頭 */}
                <svg
                  viewBox="0 0 30 30"
                  fill="none"
                  aria-hidden
                  className="absolute inset-0 size-[30px] text-brand opacity-0 transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-open:opacity-100"
                >
                  <path
                    d="M8.98959 6.86827C8.40381 6.28249 7.45406 6.28249 6.86827 6.86827C6.28249 7.45406 6.28249 8.40381 6.86827 8.98959L7.92893 7.92893L8.98959 6.86827ZM22.0711 23.5711C22.8995 23.5711 23.5711 22.8995 23.5711 22.0711L23.5711 8.57107C23.5711 7.74264 22.8995 7.07107 22.0711 7.07107C21.2426 7.07107 20.5711 7.74264 20.5711 8.57107V20.5711H8.57107C7.74264 20.5711 7.07107 21.2426 7.07107 22.0711C7.07107 22.8995 7.74264 23.5711 8.57107 23.5711L22.0711 23.5711ZM7.92893 7.92893L6.86827 8.98959L21.0104 23.1317L22.0711 22.0711L23.1317 21.0104L8.98959 6.86827L7.92893 7.92893Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="flex-1 text-h2 text-brand-ink transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-open:text-brand max-md:text-base">
                {item.question}
              </span>
            </summary>
            <p className="mt-5 text-title text-brand-ink">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
