import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 起 middleware 改名為 proxy，且只能跑在 nodejs runtime。
//
// 這裡只做官方文件所說的樂觀檢查：看 cookie 在不在就決定要不要導向登入頁，
// 不驗簽章、不查資料庫（proxy 會在每個 matcher 命中的請求上執行，包含
// 預取的路由，查 DB 會拖慢整站）。真正的授權在 admin/layout.tsx 與每個
// action 內的 requireSession()。
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  // 登入後導回原本想去的頁面，而不是一律回後台首頁
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 只匹配後台頁面。刻意不含 /api/admin/upload：有 proxy 時 Next 會把
  // request body 緩衝進記憶體（預設上限 10MB），超過只截斷並記一行 warning，
  // 不回錯誤 —— 大圖會靜默壞掉且極難追查。
  // 同時靜態資源（_next/static、_next/image、public/）天然不匹配，
  // 不必寫負向 regex 排除，也就不會誤擋 CSS 與圖片
  matcher: ["/admin/:path*"],
};
