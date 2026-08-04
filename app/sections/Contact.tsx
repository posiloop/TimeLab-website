import Image from "next/image";
import { InstagramIcon, LineIcon } from "../components/SocialIcons";

const LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "官方 LINE", href: "https://line.me/" },
  { label: "租借表單", href: "#" },
];

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
        {LINKS.map((link) => {
          const external = link.href.startsWith("http");

          return (
            <li key={link.label}>
              <a
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                aria-label={link.label}
                // IG 為外框線稿無底色，其餘為品牌色底
                className={`flex size-[100px] items-center justify-center rounded-[20px] transition-opacity hover:opacity-80 max-md:size-[70px] ${
                  link.label === "Instagram" ? "text-brand" : "bg-brand"
                }`}
              >
                {link.label === "Instagram" && (
                  <InstagramIcon className="size-[72px] max-md:size-12" />
                )}
                {link.label === "官方 LINE" && (
                  <LineIcon className="size-[72px] text-white max-md:size-12" />
                )}
                {link.label === "租借表單" && (
                  <span className="text-center text-h1 leading-tight text-white max-md:text-base">
                    租借
                    <br />
                    表單
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
