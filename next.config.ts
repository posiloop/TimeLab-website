import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // 分類頁從 /cases/<id> 併成單一 /cases 之後，舊網址仍可能出現在社群貼文、
  // 名片與搜尋結果裡。轉成 /cases#<id> 讓它們落在對應的分頁而非 404。
  // 用 307 而非 308：分類路由若要復原，瀏覽器不會記住永久轉址。
  async redirects() {
    return [
      {
        source: "/cases/:category",
        destination: "/cases#:category",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
