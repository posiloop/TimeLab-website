import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * 受保護的 server action 一律先呼叫這個。
 *
 * proxy.ts 只看 cookie 存不存在（樂觀檢查），這裡才真的驗簽章並查資料庫。
 * 不可省略：每個 server action 都是對其所在路由的 POST，任何人知道
 * action ID 就能直接送出請求；而 proxy 的 matcher 若排除了某個路徑，
 * 會連帶跳過該路徑上 server function 的保護。
 */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/**
 * Route handler 用。handler 不能靠 throw 表達未授權，需回 401 讓前端
 * 能分辨「沒登入」與「伺服器炸了」
 */
export async function getSessionFrom(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}
