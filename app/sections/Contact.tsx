import Image from "next/image";
import { InstagramIcon, LineIcon } from "../components/SocialIcons";
import { SOCIAL_LINKS } from "../data/links";

export default function Contact() {
  return (
    <section
      id="contact"
      className="flex flex-col items-center gap-10 px-4 pb-[70px] pt-[150px] max-md:pt-20"
    >
      <Image
        src="/images/brand/slogan.png"
        alt="讓每一次快門，都留下燦爛瞬間。"
        width={650}
        height={88}
        className="h-auto w-[650px] max-w-full object-contain"
      />

      <ul className="flex items-center gap-8 max-md:gap-5">
        {SOCIAL_LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              // IG 為外框線稿無底色，其餘為品牌色底
              className={`flex size-[100px] items-center justify-center rounded-[20px] transition-opacity hover:opacity-80 max-md:size-[70px] ${
                link.id === "instagram" ? "text-brand" : "bg-brand"
              }`}
            >
              {link.id === "instagram" && (
                <InstagramIcon className="size-[72px] max-md:size-12" />
              )}
              {link.id === "line" && (
                <LineIcon className="size-[72px] text-white max-md:size-12" />
              )}
              {link.id === "form" && (
                <span className="text-center text-h1 leading-tight text-white max-md:text-base">
                  租借
                  <br />
                  表單
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
