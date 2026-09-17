import SectionTitle from "../components/SectionTitle";
import { PLAN_ADDONS, PLAN_ROWS } from "../data/content";

export default function Plans() {
  return (
    <section id="plans" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>租借方案</SectionTitle>

      <div className="flex flex-col items-center pb-6">
        <div className="card-surface flex max-w-full items-center justify-center gap-5 rounded-[20px] p-5 max-lg:flex-col">
          {/* 左：基本方案，各列以底線分隔，末列不加 */}
          <div className="flex max-w-full flex-col justify-center rounded-[20px] bg-brand-mist px-5 py-[10px] max-md:px-3">
            {PLAN_ROWS.map((row, index) => (
              <div
                key={row.label}
                className={`flex w-[457px] max-w-full items-center py-[5px] max-md:flex-col max-md:items-start max-md:gap-1 ${
                  index < PLAN_ROWS.length - 1
                    ? "border-b-[0.5px] border-black/30"
                    : ""
                }`}
              >
                <div className="flex w-[180px] shrink-0 items-center justify-center rounded-[30px] p-[10px] max-md:w-auto max-md:justify-start">
                  <p className="whitespace-pre-line text-center text-h2 text-brand-ink">
                    {row.label}
                  </p>
                </div>
                <div className="text-title text-brand">
                  {row.ordered ? (
                    row.items.map((item, i) => (
                      <p key={item}>{`${i + 1}. ${item}`}</p>
                    ))
                  ) : (
                    <p>{row.items[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 右：加值服務，虛線框 */}
          <div className="flex max-w-full flex-col items-center justify-center gap-[10px] rounded-[20px] border-2 border-dashed border-brand px-5 py-[10px] max-md:px-3">
            <div className="flex items-center justify-center rounded-[20px] p-[10px]">
              <p className="text-center text-h2 text-brand-ink">+ 加值服務 +</p>
            </div>
            <ul className="flex flex-col gap-[10px]">
              {PLAN_ADDONS.map((addon) => (
                <li
                  key={addon}
                  className="flex h-10 w-[350px] max-w-full items-center justify-center rounded-[20px] bg-brand-mist p-[10px] text-center text-title text-brand-ink max-md:h-auto max-md:py-2"
                >
                  {addon}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
