import Image from "next/image";

const LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: "IG" },
  { label: "官方 LINE", href: "https://line.me/", icon: "LINE" },
  { label: "租借表單", href: "#", icon: "租借\n表單" },
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
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              aria-label={link.label}
              className="flex size-[100px] items-center justify-center whitespace-pre-line rounded-[20px] bg-brand text-center text-h1 leading-tight text-white transition-opacity hover:opacity-80 max-md:size-[70px] max-md:text-base"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
