import SectionTitle from "../components/SectionTitle";
import { RENTAL_STEPS } from "../data/content";

export default function RentalProcess() {
  return (
    <section id="process" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>租借流程</SectionTitle>

      <ol className="flex flex-col items-center gap-[10px] pb-6">
        {RENTAL_STEPS.map((step) => (
          <li
            key={step.no}
            className="card-surface flex w-full max-w-[800px] items-center justify-center overflow-hidden rounded-[16px]"
          >
            <div className="flex w-full flex-col items-start justify-center p-6">
              <div className="flex w-full items-center max-lg:flex-col max-lg:items-start max-lg:gap-0">
                {/* Mobile 設計稿的標題仍是 H1，僅 Tablet 縮到 24px */}
                <p className="w-[320px] shrink-0 text-h1 text-brand max-lg:w-[260px] max-lg:text-2xl max-md:w-auto max-md:text-h1">
                  {step.no}.{step.title}
                </p>
                <p className="text-title text-brand-ink">{step.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
