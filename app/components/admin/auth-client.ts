"use client";

import { createAuthClient } from "better-auth/react";

// 登入與登出需要 loading 與錯誤狀態，走 client 比 server action 直接。
// 刻意不放在 app/server/ —— 該目錄的約定是「只能在伺服器執行」，
// 把 client 模組混進去會讓邊界失去意義
export const authClient = createAuthClient();
