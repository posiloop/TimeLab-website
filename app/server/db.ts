import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Prisma 7 走 driver adapter，連線字串在建構 client 時傳入而非讀 schema。
// 直接 new PrismaClient() 不帶 adapter 會拋 PrismaClientInitializationError，
// 且錯誤訊息不會提到 adapter —— 一次性腳本請 import 此處的 prisma，勿自建

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("缺少環境變數 DATABASE_URL");

// dev 下 Next 的 HMR 會反覆求值模組，每次 new 一個 client 會把連線池耗盡。
// 掛在 globalThis 上讓熱重載沿用同一個實例
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// 但改了 schema 並重新 generate 之後，PrismaClient 已是另一個類別，舊實例
// 上沒有新加的 model（prisma.xxx 會是 undefined），得換成新的，否則要重開
// dev server 才讀得到。舊實例順手斷線，連線池才不會累積
// （型別上它永遠是 PrismaClient，instanceof 不成立的分支會被收窄成 never，
// 故先放寬成 unknown 再判斷）
const cached: unknown = globalForPrisma.prisma;
if (cached && !(cached instanceof PrismaClient)) {
  void (cached as PrismaClient).$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
