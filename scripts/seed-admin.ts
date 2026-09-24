/**
 * 建立第一個後台帳號。
 *
 * 執行：bun run seed:admin
 *
 * 後台的 auth 設定關閉了公開註冊（disableSignUp），而新增帳號的 server
 * action 要求呼叫者已登入 —— 第一個帳號因此沒有任何線上途徑可建立，
 * 只能靠這支一次性腳本。之後的帳號請在後台的帳號管理頁新增。
 *
 * 密碼由環境變數帶入而非寫在檔案裡，避免進入 git 歷史。
 */

import { auth } from "../app/server/auth";
import { prisma } from "../app/server/db";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "管理員";

  if (!email || !password) {
    throw new Error(
      "請先在 .env 設定 SEED_ADMIN_EMAIL 與 SEED_ADMIN_PASSWORD（密碼至少 12 字）",
    );
  }
  if (password.length < 12) {
    throw new Error("密碼至少需 12 個字元");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`${email} 已存在，未做任何變更。`);
    return;
  }

  // 走 internal adapter 而非 auth.api.signUpEmail：後者受 disableSignUp
  // 管制，連伺服器端呼叫也一併擋下。這裡直接建立 user 與密碼帳號，
  // 密碼交由 Better Auth 自己的雜湊函式處理，與登入時的驗證同一套
  const ctx = await auth.$context;

  const user = await ctx.internalAdapter.createUser(
    { email: email.toLowerCase(), name, emailVerified: true },
    { method: "email-password" },
  );

  await ctx.internalAdapter.createAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await ctx.password.hash(password),
  });

  console.log(`已建立後台帳號：${email}`);
  console.log("請到 /login 登入，並從 .env 移除 SEED_ADMIN_PASSWORD。");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
