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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
