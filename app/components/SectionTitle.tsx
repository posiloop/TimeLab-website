export default function SectionTitle({ children }: { children: string }) {
  return (
    // 設計稿為 py-24 的獨立區塊，字距 6px；尾字右側的空白以等量左內距補回
    <h2 className="flex items-center justify-center py-6">
      <span className="pl-[6px] text-center text-h2 font-bold tracking-[6px] text-brand-ink">
        {children}
      </span>
    </h2>
  );
}
