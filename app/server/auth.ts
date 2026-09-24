import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // 這是內部後台，帳號一律由 seed 腳本或已登入的管理者建立。
    // 少了這一行，POST /api/auth/sign-up/email 對全世界開放，
    // 任何人都能自助註冊並取得改動線上內容的權限
    disableSignUp: true,
    minPasswordLength: 12,
  },

  // 只有少數幾人使用，預設 7 天偏長；改 3 天並在每日活動時續期
  session: {
    expiresIn: 60 * 60 * 24 * 3,
    updateAge: 60 * 60 * 24,
  },

  // 預設用記憶體計數，容器重啟就歸零；存進資料庫才擋得住反覆試密碼
  rateLimit: {
    enabled: true,
    storage: "database",
  },

  // 讓 server action 內呼叫的 Better Auth API 能寫入 cookie
  plugins: [nextCookies()],
});
