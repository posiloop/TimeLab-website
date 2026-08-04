export default function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="flex flex-col items-center gap-[5px]">
      {/* 字距 0.5em 會在尾字右側撐出空白，補上等量左內距讓文字視覺置中 */}
      <span className="pl-[0.5em] text-center text-section tracking-[0.5em] text-brand max-md:text-[28px]">
        {children}
      </span>
      <span className="h-[3px] w-[220px] bg-brand max-md:w-[160px]" />
    </h2>
  );
}
