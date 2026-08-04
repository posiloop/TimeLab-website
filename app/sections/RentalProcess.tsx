import SectionTitle from "../components/SectionTitle";
import { RENTAL_STEPS } from "../data/content";

export default function RentalProcess() {
  return (
    <section
      id="process"
      className="flex flex-col items-center gap-[30px] px-4 pt-[150px] max-md:pt-20"
    >
      <SectionTitle>租借流程</SectionTitle>

      <ol className="w-full max-w-[1199px]">
        {RENTAL_STEPS.map((step, index) => (
          <li key={step.no}>
            <div className="flex items-stretch rounded-full border border-brand bg-brand-mist max-md:flex-col max-md:rounded-[20px]">
              <div className="flex w-[400px] shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-brand px-6 py-4 text-h1 text-white max-lg:w-[320px] max-lg:text-2xl max-md:w-full max-md:rounded-[20px] max-md:text-xl">
                <span>{step.no}</span>
                <span aria-hidden>｜</span>
                <span>{step.title}</span>
              </div>
              <p className="flex flex-1 items-center whitespace-nowrap px-8 py-4 text-h1 text-brand-ink max-xl:whitespace-normal max-lg:text-xl max-md:justify-center max-md:px-6 max-md:text-center max-md:text-base">
                {step.desc}
              </p>
            </div>
            {/* 步驟之間的倒三角連接符，最後一步不顯示 */}
            {index < RENTAL_STEPS.length - 1 && (
              <div
                aria-hidden
                className="my-2 ml-[200px] h-0 w-0 border-x-[12px] border-t-[14px] border-x-transparent border-t-brand max-lg:ml-[160px] max-md:mx-auto max-md:ml-0"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
