import { timingSafeEqual } from "node:crypto";

/**
 * 內容 API 的金鑰驗證。
 *
 * 後台介面走 Better Auth 的 session cookie，但外部系統沒有瀏覽器也沒有
 * 登入流程，故另開一把靜態金鑰。兩套憑證彼此獨立：金鑰外洩不會連帶
 * 取得後台登入權，後台帳號被刪也不影響既有的外部整合。
 */

/**
 * 金鑰比對。
 *
 * 用 timingSafeEqual 而非 === ：字串比較會在第一個不同的字元就回傳，
 * 攻擊者可藉由回應時間逐字元試出金鑰。長度不同時先比一組等長的假資料
 * 再回 false，讓「長度錯」與「內容錯」花掉同樣的時間。
 */
function matches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    // 仍然做一次等長比對才回傳，避免長度本身變成可觀測的訊號
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export type AuthFailure = { error: string; status: 401 | 503 };

/**
 * 驗證請求的 Authorization 標頭。
 *
 * 通過回 null，失敗回可直接送出的錯誤內容。
 *
 * 未設定 CONTENT_API_KEY 時一律拒絕並回 503，而不是放行 ——
 * 「忘了設定」與「不打算啟用」在環境變數上看起來一模一樣，
 * 預設關閉才不會讓一次疏漏把整份內容曝露成可寫入。
 */
export function verifyApiKey(request: Request): AuthFailure | null {
  const expected = process.env.CONTENT_API_KEY;

  if (!expected || expected.length < 32) {
    return {
      error: "內容 API 未啟用",
      status: 503,
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !matches(token, expected)) {
    return { error: "金鑰不正確", status: 401 };
  }

  return null;
}
