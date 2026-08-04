import SectionTitle from "../components/SectionTitle";
import { PLAN_ADDONS, PLAN_ROWS } from "../data/content";

export default function Plans() {
  return (
    <section
      id="plans"
      className="flex flex-col items-center gap-[30px] px-4 pt-[150px] max-md:pt-20"
    >
      <SectionTitle>方案內容</SectionTitle>

      <div className="flex w-full max-w-[1560px] items-center justify-center gap-10 max-xl:flex-col">
        {/* 左：基本方案 */}
        <div className="flex w-[765px] max-w-full flex-col gap-8 rounded-[20px] bg-brand-mist/70 px-10 py-9 max-md:px-6">
          {PLAN_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-start gap-8 max-md:flex-col max-md:items-center max-md:gap-3"
            >
              <span className="flex h-[50px] w-[200px] shrink-0 items-center justify-center rounded-full bg-brand-ink text-title text-white">
                {row.label}
              </span>
              {row.ordered ? (
                <ol className="flex flex-col gap-1 pt-3 text-title text-brand-ink max-md:pt-0 max-md:text-center">
                  {row.items.map((item, i) => (
                    <li key={item}>{`${i + 1}. ${item}`}</li>
                  ))}
                </ol>
              ) : (
                <p className="pt-3 text-title text-brand-ink max-md:pt-0">
                  {row.items[0]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 右：加值服務 —— 中間以分支線連向各項目 */}
        <div className="flex items-center max-md:flex-col max-md:gap-4">
          <span className="flex h-[60px] shrink-0 items-center gap-2 rounded-full border-2 border-brand-ink px-6 text-h1 text-brand-ink max-md:text-2xl">
            <span aria-hidden>⊕</span> 加值服務
          </span>
          {/* 分支線：垂直主幹 + 每項一條水平箭頭，手機版隱藏 */}
          <div
            aria-hidden
            className="relative w-10 self-stretch max-md:hidden"
          >
            <span className="absolute left-1/2 top-[12.5%] h-[75%] w-px bg-brand-ink" />
          </div>
          <ul className="flex flex-col gap-4">
            {PLAN_ADDONS.map((addon) => (
              <li
                key={addon}
                className="flex h-[60px] items-center max-md:h-auto"
              >
                <span
                  aria-hidden
                  className="relative h-px w-8 bg-brand-ink max-md:hidden after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:border-y-[5px] after:border-l-[8px] after:border-y-transparent after:border-l-brand-ink after:content-['']"
                />
                <span className="flex h-full items-center rounded-[10px] bg-brand-mist px-6 text-title text-brand-ink max-md:py-3 max-md:text-center">
                  {addon}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
