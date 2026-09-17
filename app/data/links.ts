export type SocialLink = {
  id: "instagram" | "line" | "form";
  label: string;
  href: string;
  /** 設計稿匯出的圖示 */
  icon: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/timelab_tw_/",
    icon: "/images/social/instagram.png",
  },
  {
    id: "line",
    label: "官方 LINE",
    href: "https://line.me/R/ti/p/@034tnwxh",
    icon: "/images/social/line.png",
  },
  {
    id: "form",
    label: "租借表單",
    href: "https://docs.google.com/forms/d/1zNsjjllKzRvACAE0wQxDAEDKMGTToz4mpP7q5shxVm4/viewform?edit_requested=true",
    icon: "/images/social/form.png",
  },
];
