import Image from "next/image";
import SectionTitle from "../components/SectionTitle";
import { SOCIAL_LINKS } from "../data/links";

export default function Contact() {
  return (
    <section id="contact" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>聯絡我們</SectionTitle>

      <div className="flex flex-col items-center justify-center pb-6">
        <ul className="flex flex-wrap items-start justify-center gap-12 max-xl:gap-5 max-lg:flex-col max-lg:items-center">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="card-surface flex h-[100px] w-[250px] items-center gap-4 rounded-[20px] border-[0.5px] px-5 drop-shadow-[0_0_2px_rgba(0,0,0,0.1)] transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.96]"
              >
                {/* 設計稿於黑色圖示上疊品牌色並用 lighten 混合，
                    黑色部分被提亮成品牌紫，白色部分維持不變 */}
                <span
                  aria-hidden
                  className="relative size-16 shrink-0 overflow-hidden rounded-[8px]"
                >
                  <Image
                    src={link.icon}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 object-contain"
                  />
                  <span className="absolute inset-0 rounded-[8px] bg-brand mix-blend-lighten" />
                </span>
                <span className="text-[24px] font-semibold leading-[1.4] tracking-[-0.36px] text-black">
                  {link.label}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="pt-12 text-center text-h1 text-brand max-md:pt-8 max-md:text-2xl">
          “讓每一次快門，都留下燦爛瞬間。”
        </p>
      </div>
    </section>
  );
}
