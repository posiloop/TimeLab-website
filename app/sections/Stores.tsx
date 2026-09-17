import Image from "next/image";
import SectionTitle from "../components/SectionTitle";
import { STORES } from "../data/stores";

export default function Stores() {
  return (
    <section id="stores" className="px-16 max-lg:px-8 max-md:px-5">
      <SectionTitle>門市資訊</SectionTitle>

      <ul className="flex justify-center gap-8 pb-6 max-md:flex-col max-md:items-center">
        {STORES.map((store) => (
          <li key={store.name} className="w-[415px] max-w-full">
            <a
              href={store.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="card-surface flex h-full flex-col overflow-hidden rounded-[16px] max-md:h-[268px] max-md:flex-row shadow-[0_4px_8px_rgba(0,0,0,0.02),0_6px_12px_rgba(0,0,0,0.03)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.96] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
            >
              {/* 原圖為直式，此處裁成橫幅；用 fill 讓尺寸完全由容器決定 */}
              <div className="relative h-[240px] w-full shrink-0 max-xl:h-[280px] max-md:h-full max-md:w-1/2">
                <Image
                  src={store.image}
                  alt={`${store.name}門市`}
                  fill
                  sizes="(max-width: 768px) 100vw, 415px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-6 max-md:w-1/2 max-md:justify-center">
                <h3 className="text-h2 text-brand">{store.name}</h3>
                <div className="text-title text-black/55">
                  <p>{store.hours}</p>
                  <p>{store.address}</p>
                </div>
                <p className="text-title text-black/55 underline opacity-60">查看地圖</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
