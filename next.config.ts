import type { NextConfig } from "next";

// 媒體檔案的 CDN 網域。remotePatterns 在 build 時就要定案，執行期才注入的
// 值讀不到，故這個變數必須在 build 階段就存在
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
const mediaHost = mediaUrl ? new URL(mediaUrl).hostname : undefined;

const nextConfig: NextConfig = {
  output: "standalone",

  // sharp 與 Prisma 都帶原生二進位檔，打包進 bundle 會在執行期找不到 .node。
  // standalone 產出也需要這個提示才會把它們原樣複製進去
  serverExternalPackages: ["sharp", "@prisma/client"],

  images: {
    remotePatterns: mediaHost
      ? [
          {
            protocol: "https",
            hostname: mediaHost,
            // 限定在 media/ 底下：放任整個網域等於把自家的圖片最佳化服務
            // 開放成任意來源的轉檔代理
            pathname: "/media/**",
          },
        ]
      : [],
  },

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
