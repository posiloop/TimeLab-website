import Image from "next/image";
import type { DutyBlock, Partnership } from "../data/content";

function Duties({ blocks }: { blocks: DutyBlock[] }) {
  return (
    <div className="flex w-full justify-center gap-6 max-lg:flex-col max-lg:items-center">
      {blocks.map((block) => (
        <div
          key={block.label}
          className={`flex min-h-[160px] flex-1 items-center justify-center gap-10 rounded-[20px] border-[3px] px-6 py-5 max-md:flex-col max-md:gap-4 ${
            block.dashed
              ? "border-dashed border-brand-ink"
              : "border-solid border-brand"
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-full px-6 py-2 text-h1 text-white max-md:text-2xl ${
              block.dashed ? "bg-brand-ink" : "bg-brand"
            }`}
          >
            {block.label}
          </span>
          <div className="flex gap-8 max-md:flex-col max-md:gap-2">
            {block.columns.map((column, i) => (
              <ul
                key={i}
                className={`list-disc space-y-1 pl-6 text-h2 max-md:text-base ${
                  block.dashed ? "text-brand-ink" : "text-brand"
                }`}
              >
                {column.map((entry) => (
                  <li key={entry} className="whitespace-nowrap max-md:whitespace-normal">
                    {entry}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PartnershipDetail({ item }: { item: Partnership }) {
  const { modal } = item;

  return (
    <div className="flex flex-col items-center gap-5">
      <h3 className="text-center text-h1 text-brand max-md:text-2xl">
        {modal.subtitle}
      </h3>

      {/* 場域活化：三張收益級距卡 */}
      {modal.tiers && (
        <ul className="flex w-full justify-center gap-5 max-lg:flex-col max-lg:items-center">
          {modal.tiers.map((tier) => (
            <li
              key={tier.revenue}
              className="w-[440px] max-w-full overflow-hidden rounded-[20px]"
            >
              <div className="relative h-[180px]">
                <Image
                  src={tier.image}
                  alt=""
                  fill
                  sizes="440px"
                  className="object-cover blur-[2.5px]"
                />
                <p className="absolute inset-x-0 bottom-3 px-3 text-center text-h2 text-white [text-shadow:4px_4px_4px_rgba(0,0,0,0.5)] max-md:text-sm">
                  {tier.caption}
                </p>
              </div>
              <div className="bg-brand-mist px-5 py-3">
                <p className="text-h2 text-brand-ink max-md:text-sm">
                  預估每月收益
                </p>
                <p className="text-h1 text-brand max-md:text-xl">
                  {tier.revenue}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 品牌活動：活動照拼貼 + 適用類型勾選清單 */}
      {modal.gallery && (
        <div className="relative w-full max-w-[1360px] overflow-hidden rounded-[20px]">
          <ul className="flex h-[283px] gap-1 max-md:h-[180px]">
            {modal.gallery.map((src) => (
              <li key={src} className="relative flex-1">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 454px"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
          {modal.eventTypes && (
            <>
              {/* 壓暗底圖，確保白字可讀 */}
              <div aria-hidden className="absolute inset-0 bg-black/35" />
              <ul className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 grid-cols-5 gap-x-5 gap-y-3 px-4 text-center text-h1 text-white [text-shadow:2px_2px_6px_rgba(0,0,0,0.9)] max-lg:text-xl max-md:grid-cols-3 max-md:text-sm">
                {modal.eventTypes.map((type) => (
                  <li key={type} className="whitespace-nowrap max-md:whitespace-normal">
                    ✓ {type}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <p className="text-center text-h2 text-brand-ink max-md:text-sm">
        {modal.footnote}
      </p>

      <Duties blocks={modal.duties} />
    </div>
  );
}
