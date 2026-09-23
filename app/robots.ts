import type { MetadataRoute } from "next";
import { SITE_URL } from "./data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // 後台與登入頁不該進搜尋結果；admin layout 另有 robots: noindex
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
