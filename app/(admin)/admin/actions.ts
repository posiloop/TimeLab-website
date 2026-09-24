"use server";

import { z } from "zod";
import { requireSession } from "@/app/server/admin-guard";
import { auth } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { revalidateContent } from "@/app/server/content/revalidate";

// 每個 action 都是對其所在路由的公開 POST 端點，任何人知道 action ID
// 就能送出請求。requireSession() 不可省略 —— proxy.ts 只做樂觀檢查，
// 而 matcher 的任何調整都可能讓這裡失去 proxy 的保護。

export type ActionResult = { ok: true } | { ok: false; error: string };

/** 排序採間隔 1000 的稀疏配置，與遷移腳本一致 */
const STEP = 1000;

const ok = (): ActionResult => ({ ok: true });
const fail = (error: string): ActionResult => ({ ok: false, error });

// ---------------------------------------------------------------------------
// 排序
// ---------------------------------------------------------------------------

const idListSchema = z.array(z.string().min(1)).min(1);

/**
 * 整軌重新編號。
 *
 * 一次送整排而非每拖一次打一次 API：後者會讓使用者調整 12 張順序時
 * 觸發數十次前台失效，且無法取消。
 *
 * position 有 @@unique 約束，中途狀態會撞鍵，故必須包在交易裡並先挪到
 * 負數區 —— 負數不會與正式值衝突，交易結束前就會全部改寫完畢。
 */
type Reorderable =
  | "heroSlide"
  | "eventPhoto"
  | "frameAnimation"
  | "faqItem"
  | "caseItem";

/** 五個 model 的 update 都吃得下這個形狀，但 TypeScript 無法把五組泛型
    簽章合併成可呼叫的聯集，故在此收窄成實際用到的那一個方法 */
type PositionUpdater = {
  update(args: {
    where: { id: string };
    data: { position: number };
  }): Promise<unknown>;
};

async function reorder(model: Reorderable, ids: string[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const table = tx[model] as unknown as PositionUpdater;
    const update = (id: string, position: number) =>
      table.update({ where: { id }, data: { position } });

    // 先全部挪到負數區：position 有唯一約束，依序改寫會在中途撞鍵，
    // 而負數不可能與正式值衝突
    for (const [index, id] of ids.entries()) await update(id, -(index + 1));
    for (const [index, id] of ids.entries()) await update(id, (index + 1) * STEP);
  });
}

export async function reorderHeroTrack(
  ids: string[],
): Promise<ActionResult> {
  await requireSession();
  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("排序資料不正確");

  await reorder("heroSlide", parsed.data);
  revalidateContent("hero");
  return ok();
}

export async function reorderEventTrack(
  ids: string[],
): Promise<ActionResult> {
  await requireSession();
  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("排序資料不正確");

  await reorder("eventPhoto", parsed.data);
  revalidateContent("events");
  return ok();
}

export async function reorderFrames(ids: string[]): Promise<ActionResult> {
  await requireSession();
  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("排序資料不正確");

  await reorder("frameAnimation", parsed.data);
  revalidateContent("frames");
  return ok();
}

export async function reorderCaseItems(ids: string[]): Promise<ActionResult> {
  await requireSession();
  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("排序資料不正確");

  await reorder("caseItem", parsed.data);
  revalidateContent("cases");
  return ok();
}

export async function reorderFaq(ids: string[]): Promise<ActionResult> {
  await requireSession();
  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("排序資料不正確");

  await reorder("faqItem", parsed.data);
  revalidateContent("faq");
  return ok();
}

// ---------------------------------------------------------------------------
// 顯示／隱藏
// ---------------------------------------------------------------------------

export async function toggleHeroSlide(
  id: string,
  isVisible: boolean,
): Promise<ActionResult> {
  await requireSession();
  await prisma.heroSlide.update({ where: { id }, data: { isVisible } });
  revalidateContent("hero");
  return ok();
}

export async function toggleEventPhoto(
  id: string,
  isVisible: boolean,
): Promise<ActionResult> {
  await requireSession();
  await prisma.eventPhoto.update({ where: { id }, data: { isVisible } });
  revalidateContent("events");
  return ok();
}

export async function toggleFrame(
  id: string,
  isVisible: boolean,
): Promise<ActionResult> {
  await requireSession();
  await prisma.frameAnimation.update({ where: { id }, data: { isVisible } });
  revalidateContent("frames");
  return ok();
}

export async function toggleCaseItem(
  id: string,
  isVisible: boolean,
): Promise<ActionResult> {
  await requireSession();
  await prisma.caseItem.update({ where: { id }, data: { isVisible } });
  revalidateContent("cases");
  return ok();
}

export async function toggleFaq(
  id: string,
  isVisible: boolean,
): Promise<ActionResult> {
  await requireSession();
  await prisma.faqItem.update({ where: { id }, data: { isVisible } });
  revalidateContent("faq");
  return ok();
}

// ---------------------------------------------------------------------------
// 新增與刪除
// ---------------------------------------------------------------------------

/**
 * 把上傳好的圖片加進主視覺。
 *
 * 一次加進三軌的尾端：三軌共用同一組相框，只加進一軌會讓使用者以為
 * 上傳失敗（另外兩軌看不到變化）。尺寸沿用該軌既有的版面值，不採用
 * 新檔案的真實比例 —— 12 張原檔本來就有三種尺寸，跟著檔案走會讓
 * 相框寬度出現次像素差。
 */
export async function addHeroSlide(assetId: string): Promise<ActionResult> {
  await requireSession();

  const tracks = ["TRACK_1", "TRACK_2", "TRACK_3"] as const;

  for (const track of tracks) {
    const last = await prisma.heroSlide.findFirst({
      where: { track },
      orderBy: { position: "desc" },
      select: { position: true, displayWidth: true, displayHeight: true },
    });

    await prisma.heroSlide.create({
      data: {
        track,
        assetId,
        position: (last?.position ?? 0) + STEP,
        displayWidth: last?.displayWidth ?? 275,
        displayHeight: last?.displayHeight ?? 410,
      },
    });
  }

  revalidateContent("hero");
  return ok();
}

export async function removeHeroSlide(id: string): Promise<ActionResult> {
  await requireSession();
  await prisma.heroSlide.delete({ where: { id } });
  revalidateContent("hero");
  return ok();
}

const addEventSchema = z.object({
  assetId: z.string().min(1),
  track: z.enum(["TRACK_1", "TRACK_2", "TRACK_3"]),
  displayWidth: z.number().int().positive(),
  displayHeight: z.number().int().positive(),
});

export async function addEventPhoto(
  input: z.infer<typeof addEventSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = addEventSchema.safeParse(input);
  if (!parsed.success) return fail("資料不正確");

  const last = await prisma.eventPhoto.findFirst({
    where: { track: parsed.data.track },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.eventPhoto.create({
    data: {
      track: parsed.data.track,
      assetId: parsed.data.assetId,
      position: (last?.position ?? 0) + STEP,
      displayWidth: parsed.data.displayWidth,
      displayHeight: parsed.data.displayHeight,
    },
  });

  revalidateContent("events");
  return ok();
}

export async function removeEventPhoto(id: string): Promise<ActionResult> {
  await requireSession();
  await prisma.eventPhoto.delete({ where: { id } });
  revalidateContent("events");
  return ok();
}

const addCaseItemSchema = z.object({
  categoryId: z.string().min(1),
  assetId: z.string().min(1),
  name: z.string().trim().min(1, "請填寫案例名稱"),
});

export async function addCaseItem(
  input: z.infer<typeof addCaseItemSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = addCaseItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  const last = await prisma.caseItem.findFirst({
    where: { categoryId: parsed.data.categoryId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.caseItem.create({
    data: {
      categoryId: parsed.data.categoryId,
      assetId: parsed.data.assetId,
      name: parsed.data.name,
      position: (last?.position ?? 0) + STEP,
    },
  });

  revalidateContent("cases");
  return ok();
}

export async function updateCaseItemName(
  id: string,
  name: string,
): Promise<ActionResult> {
  await requireSession();
  const trimmed = name.trim();
  if (!trimmed) return fail("請填寫案例名稱");

  await prisma.caseItem.update({ where: { id }, data: { name: trimmed } });
  revalidateContent("cases");
  return ok();
}

export async function removeCaseItem(id: string): Promise<ActionResult> {
  await requireSession();
  await prisma.caseItem.delete({ where: { id } });
  revalidateContent("cases");
  return ok();
}

// ---------------------------------------------------------------------------
// 分類
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "請填寫分類名稱"),
  tagline: z.string().trim().min(1, "請填寫副標"),
});

/**
 * 更新分類的顯示文字。
 *
 * 刻意不開放修改 slug：它同時被首頁卡片的 /cases#<slug>、CasesView 的
 * hash 白名單與 next.config.ts 的 redirect 依賴，改了會讓既有的社群貼文
 * 與名片連結靜默導到錯誤分類（不會 404，所以不會有人回報）。
 */
export async function updateCaseCategory(
  input: z.infer<typeof categorySchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  await prisma.caseCategory.update({
    where: { id: parsed.data.id },
    data: { label: parsed.data.label, tagline: parsed.data.tagline },
  });

  revalidateContent("cases");
  return ok();
}

export async function updateCategoryCover(
  id: string,
  coverId: string,
): Promise<ActionResult> {
  await requireSession();
  await prisma.caseCategory.update({ where: { id }, data: { coverId } });
  revalidateContent("cases");
  return ok();
}

// ---------------------------------------------------------------------------
// 拍貼框動畫
// ---------------------------------------------------------------------------

const frameSchema = z.object({
  id: z.string().min(1),
  alt: z.string().trim().min(1, "請填寫描述文字"),
  displayWidth: z.number().int().positive(),
  displayHeight: z.number().int().positive(),
  rotate: z.number().min(-45).max(45),
  boxWidth: z.number().int().positive(),
  boxHeight: z.number().int().positive(),
});

export async function updateFrame(
  input: z.infer<typeof frameSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = frameSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  const { id, ...data } = parsed.data;
  await prisma.frameAnimation.update({ where: { id }, data });
  revalidateContent("frames");
  return ok();
}

export async function replaceFrameMedia(
  id: string,
  media: { posterId: string; webmId: string; mp4Id: string },
): Promise<ActionResult> {
  await requireSession();
  await prisma.frameAnimation.update({ where: { id }, data: media });
  revalidateContent("frames");
  return ok();
}

// ---------------------------------------------------------------------------
// 常見問題
// ---------------------------------------------------------------------------

const faqSchema = z.object({
  question: z.string().trim().min(1, "請填寫問題"),
  answer: z.string().trim().min(1, "請填寫答案"),
});

export async function createFaq(
  input: z.infer<typeof faqSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  const last = await prisma.faqItem.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.faqItem.create({
    data: { ...parsed.data, position: (last?.position ?? 0) + STEP },
  });

  revalidateContent("faq");
  return ok();
}

export async function updateFaq(
  id: string,
  input: z.infer<typeof faqSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  await prisma.faqItem.update({ where: { id }, data: parsed.data });
  revalidateContent("faq");
  return ok();
}

export async function removeFaq(id: string): Promise<ActionResult> {
  await requireSession();
  await prisma.faqItem.delete({ where: { id } });
  revalidateContent("faq");
  return ok();
}

// ---------------------------------------------------------------------------
// 帳號
// ---------------------------------------------------------------------------

const accountSchema = z.object({
  email: z.email("請填寫有效的 Email"),
  name: z.string().trim().min(1, "請填寫姓名"),
  password: z.string().min(12, "密碼至少 12 個字元"),
});

/**
 * 新增後台帳號。
 *
 * auth.ts 設了 disableSignUp，對外的註冊端點是關閉的；這裡走 internal
 * adapter 直接建立，並以 requireSession() 確保只有已登入者能呼叫。
 */
export async function createAccount(
  formData: FormData,
): Promise<ActionResult> {
  await requireSession();

  const parsed = accountSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return fail("這個 Email 已經有帳號了");
  }

  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser(
    { email, name: parsed.data.name, emailVerified: true },
    { method: "email-password" },
  );
  await ctx.internalAdapter.createAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await ctx.password.hash(parsed.data.password),
  });

  return ok();
}

export async function removeAccount(id: string): Promise<ActionResult> {
  const session = await requireSession();
  // 刪掉自己會讓使用者當場登出且可能無人可管理，直接擋下
  if (session.user.id === id) return fail("不能刪除自己的帳號");

  const count = await prisma.user.count();
  if (count <= 1) return fail("至少要保留一個帳號");

  await prisma.user.delete({ where: { id } });
  return ok();
}
