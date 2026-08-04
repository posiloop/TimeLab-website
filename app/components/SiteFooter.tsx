import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="flex h-[300px] flex-col items-center justify-center bg-brand max-md:h-[220px]">
      <Image
        src="/images/brand/logo-light.png"
        alt="時光研究室"
        width={150}
        height={100}
        className="h-[100px] w-[150px] object-contain max-md:h-[70px] max-md:w-[105px]"
      />
      <p className="glow text-center text-[60px] leading-none tracking-[0.2em] text-brand-mist max-md:text-[32px]">
        時光研究室
      </p>
    </footer>
  );
}
