export type SocialLink = {
  id: "instagram" | "line" | "form";
  label: string;
  href: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/timelab_tw_/",
  },
  {
    id: "line",
    label: "官方 LINE",
    href: "https://line.me/R/ti/p/@034tnwxh",
  },
  {
    id: "form",
    label: "租借表單",
    href: "https://docs.google.com/forms/d/1zNsjjllKzRvACAE0wQxDAEDKMGTToz4mpP7q5shxVm4/viewform?edit_requested=true",
  },
];
