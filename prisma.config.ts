import { defineConfig, env } from "prisma/config";

// Prisma 7 起 datasource.url 不再寫在 schema.prisma，改由此處提供給
// migrate 與 introspect 使用；執行期的連線則走 app/server/db.ts 的
// driver adapter。env() 會在變數缺漏時明確報錯，而非靜默連到空字串
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
