import Image from "next/image";
import { STORES } from "../data/stores";

function Pill({ children }: { children: string }) {
  return (
    <span className="flex h-9 w-[85px] shrink-0 items-center justify-center rounded-full bg-brand text-title text-brand-mist">
      {children}
    </span>
  );
}

export default function Stores() {
  return (
    <section id="stores" className="px-4 py-[150px] max-md:py-20">
      <ul className="mx-auto flex max-w-[1735px] flex-wrap justify-center gap-[57px] max-lg:gap-8">
        {STORES.map((store) => (
          <li
            key={store.name}
            className="grid h-[380px] w-[747px] max-w-full grid-cols-[450px_minmax(0,1fr)] overflow-hidden rounded-[20px] bg-brand-mist max-lg:h-auto max-lg:w-full max-lg:max-w-[560px] max-lg:grid-cols-1"
          >
            <Image
              src={store.image}
              alt={`${store.name}門市`}
              width={450}
              height={380}
              className="h-full w-full rounded-[20px] bg-brand-mist object-cover shadow-[5px_0_15px_rgba(0,0,0,0.25)] max-lg:h-[240px]"
            />
            <div className="flex flex-col justify-center gap-5 px-6 py-8">
              <div className="flex flex-col items-center gap-[6px]">
                <Pill>營業時間</Pill>
                <p className="text-title font-semibold text-brand-ink">
                  {store.hours}
                </p>
              </div>
              <div className="flex flex-col items-center gap-[6px]">
                <Pill>營業地點</Pill>
                <p className="whitespace-pre-line text-center text-title font-semibold text-brand-ink">
                  {store.address}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
