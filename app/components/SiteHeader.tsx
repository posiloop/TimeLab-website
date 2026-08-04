const NAV_ITEMS = [
  { label: "關於我們", href: "#about" },
  { label: "門市資訊", href: "#stores" },
  { label: "機台介紹", href: "#machines" },
  { label: "活動案例", href: "#cases" },
  { label: "租借流程", href: "#process" },
  { label: "方案內容", href: "#plans" },
  { label: "互惠合作", href: "#partnership" },
  { label: "聯絡我們", href: "#contact" },
];

export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[100px] bg-brand-mist shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <nav
        aria-label="主選單"
        className="flex h-full items-end justify-center gap-[25px] px-4 pb-[10px] max-lg:items-center max-lg:justify-start max-lg:gap-2 max-lg:overflow-x-auto max-lg:pb-0"
      >
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex h-10 w-[120px] shrink-0 items-center justify-center rounded-full text-h2 text-brand-ink transition-colors hover:bg-brand hover:text-brand-mist max-lg:h-9 max-lg:w-auto max-lg:px-4 max-lg:text-base"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
