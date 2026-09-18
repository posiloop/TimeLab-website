import Image from "next/image";
import type { DutyBlock, Partnership } from "../data/content";

/** 職責區塊：膠囊標籤在左、項目單欄直列於右 */
function Duties({ blocks }: { blocks: DutyBlock[] }) {
  return (
    <div className="flex w-full flex-col gap-5">
      {blocks.map((block) => (
        <div
          key={block.label}
          className={`flex items-center gap-[30px] rounded-[20px] border-[3px] p-[30px] max-md:gap-4 max-md:p-5 ${
            block.dashed
              ? "border-dashed border-brand-ink"
              : "border-solid border-brand"
          }`}
        >
          <span
            className={`flex h-[50px] w-[140px] shrink-0 items-center justify-center rounded-full text-h2 text-white max-md:w-[110px] max-md:text-base ${
              block.dashed ? "bg-brand-ink" : "bg-brand"
            }`}
          >
            {block.label}
          </span>

          {/* 設計稿為單欄直列，資料的兩欄在此攤平 */}
          <ul
            className={`list-disc pl-6 text-title ${
              block.dashed ? "text-brand-ink" : "text-brand"
            }`}
          >
            {block.columns.flat().map((entry) => (
              <li key={entry} className="whitespace-nowrap">
                {entry}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function PartnershipDetail({ item }: { item: Partnership }) {
  const { modal } = item;

  return (
    /* 桌機左右兩欄（設計稿 1075px）；窄版改上下堆疊（設計稿 680px） */
    <div className="flex justify-center gap-10 max-[1075px]:flex-col max-[1075px]:items-center">
      {/* 合作模式／服務內容 */}
      <div className="flex w-[355px] shrink-0 flex-col gap-5 max-[1075px]:w-full max-[1075px]:max-w-[600px]">
        <h3 className="text-h2 text-brand">{modal.dutiesTitle}</h3>
        <Duties blocks={modal.duties} />
      </div>

      {/* 收益區間／適用活動類型 */}
      <div className="flex w-[600px] shrink-0 flex-col gap-5 max-[1075px]:w-full max-[1075px]:max-w-[600px]">
        {/* 收益區間的標題在設計稿置中，活動類型的則靠左 */}
        <h3 className={`text-h2 text-brand ${modal.tiers ? "text-center" : ""}`}>
          {modal.subtitle}
        </h3>

        {/* 場域活化：三張收益級距卡，左圖右文 */}
        {modal.tiers && (
          <ul className="flex w-full flex-col gap-5">
            {modal.tiers.map((tier) => (
              <li key={tier.revenue} className="flex w-full items-center">
                <div className="relative size-[150px] shrink-0 overflow-hidden rounded-l-[20px] max-md:size-[110px]">
                  <Image
                    src={tier.image}
                    alt=""
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </div>
                <div className="flex h-[150px] min-w-0 flex-1 flex-col justify-center gap-[23px] rounded-r-[20px] bg-brand-mist pl-5 text-brand-ink max-md:h-[110px] max-md:gap-2 max-md:pl-3">
                  <p className="text-h2 max-md:text-sm">{tier.caption}</p>
                  <div>
                    <p className="text-h2 max-md:text-sm">預估每月收益</p>
                    <p className="text-h1 text-brand max-md:text-xl">
                      {tier.revenue}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 品牌活動：左側三張堆疊活動照，右側勾選清單 */}
        {modal.gallery && (
          <div className="flex items-center gap-[60px] overflow-hidden rounded-[20px] bg-brand-mist max-lg:gap-8 max-md:gap-4">
            {/* 三張活動照無間隙堆疊，總高 490px 對齊清單 */}
            <ul className="w-[262px] shrink-0 max-lg:w-[180px] max-md:w-[120px]">
              {modal.gallery.map((src) => (
                <li
                  key={src}
                  className="relative h-[163.33px] w-full max-lg:h-[130px] max-md:h-[90px]"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 120px, (max-width: 1024px) 180px, 262px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
            {modal.eventTypes && (
              <ul className="py-5 text-h1 text-brand-ink max-lg:text-xl max-md:text-base">
                {modal.eventTypes.map((type) => (
                  <li key={type} className="whitespace-nowrap">
                    ✔ {type}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 設計稿為白色字身配品牌色描邊；paint-order 讓描邊畫在填色下方，
            筆畫才不會被描邊吃掉 */}
        <p className="text-h2 text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_var(--color-brand)]">
          {modal.footnote}
        </p>
      </div>
    </div>
  );
}
