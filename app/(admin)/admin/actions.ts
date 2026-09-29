"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { requireSession } from "@/app/server/admin-guard";
import { auth } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import { revalidateContent } from "@/app/server/content/revalidate";
import { reorder, STEP } from "@/app/server/content/reorder";
import { deleteObject, mediaUrl } from "@/app/server/s3";

// 每個 action 都是對其所在路由的公開 POST 端點，任何人知道 action ID
// 就能送出請求。requireSession() 不可省略 —— proxy.ts 只做樂觀檢查，
// 而 matcher 的任何調整都可能讓這裡失去 proxy 的保護。

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * 帶回傳值的 action 結果。
 *
 * 新增類的 action 需要把建立出來的項目交回前端 —— 前端的清單是
 * useState(props) 初始化的，router.refresh() 帶回的新 props 不會寫進
 * 已初始化的 state，所以新項目得由前端自己併進清單才會立刻出現。
 */
export type ActionData<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ok = (): ActionResult => ({ ok: true });
const okWith = <T,>(data: T): ActionData<T> => ({ ok: true, data });
// 回傳型別寫成失敗分支本身，而非 ActionResult —— 它同時是
// ActionData<T> 的失敗分支，兩種 action 才能共用這個輔助函式
const fail = (error: string) => ({ ok: false as const, error });

// ---------------------------------------------------------------------------
// 排序
// ---------------------------------------------------------------------------

const idListSchema = z.array(z.string().min(1)).min(1);

// 整軌重新編號的實作在 app/server/content/reorder.ts，與內容 API 共用

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
export type CreatedHeroSlide = {
  track: "TRACK_1" | "TRACK_2" | "TRACK_3";
  id: string;
  assetId: string;
  url: string;
  name: string;
  isVisible: boolean;
  displayWidth: number;
  displayHeight: number;
};

export async function addHeroSlide(
  assetId: string,
): Promise<ActionData<CreatedHeroSlide[]>> {
  await requireSession();

  const tracks = ["TRACK_1", "TRACK_2", "TRACK_3"] as const;
  const created: CreatedHeroSlide[] = [];

  for (const track of tracks) {
    const last = await prisma.heroSlide.findFirst({
      where: { track },
      orderBy: { position: "desc" },
      select: { position: true, displayWidth: true, displayHeight: true },
    });

    const slide = await prisma.heroSlide.create({
      data: {
        track,
        assetId,
        position: (last?.position ?? 0) + STEP,
        displayWidth: last?.displayWidth ?? 275,
        displayHeight: last?.displayHeight ?? 410,
      },
      select: {
        id: true,
        assetId: true,
        isVisible: true,
        displayWidth: true,
        displayHeight: true,
        asset: { select: { key: true, originalName: true } },
      },
    });

    created.push({
      track,
      id: slide.id,
      assetId: slide.assetId,
      url: mediaUrl(slide.asset.key),
      name: slide.asset.originalName ?? "未命名",
      isVisible: slide.isVisible,
      displayWidth: slide.displayWidth,
      displayHeight: slide.displayHeight,
    });
  }

  revalidateContent("hero");
  return okWith(created);
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

export type CreatedEventPhoto = {
  id: string;
  url: string;
  name: string;
  isVisible: boolean;
  displayWidth: number;
  displayHeight: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
};

export async function addEventPhoto(
  input: z.infer<typeof addEventSchema>,
): Promise<ActionData<CreatedEventPhoto>> {
  await requireSession();
  const parsed = addEventSchema.safeParse(input);
  if (!parsed.success) return fail("資料不正確");

  const last = await prisma.eventPhoto.findFirst({
    where: { track: parsed.data.track },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const created = await prisma.eventPhoto.create({
    data: {
      track: parsed.data.track,
      assetId: parsed.data.assetId,
      position: (last?.position ?? 0) + STEP,
      displayWidth: parsed.data.displayWidth,
      displayHeight: parsed.data.displayHeight,
    },
    select: {
      id: true,
      isVisible: true,
      displayWidth: true,
      displayHeight: true,
      asset: {
        select: {
          key: true,
          originalName: true,
          intrinsicWidth: true,
          intrinsicHeight: true,
        },
      },
    },
  });

  revalidateContent("events");
  return okWith({
    id: created.id,
    url: mediaUrl(created.asset.key),
    name: created.asset.originalName ?? "未命名",
    isVisible: created.isVisible,
    displayWidth: created.displayWidth,
    displayHeight: created.displayHeight,
    intrinsicWidth: created.asset.intrinsicWidth,
    intrinsicHeight: created.asset.intrinsicHeight,
  });
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

export type CreatedCaseItem = {
  id: string;
  name: string;
  isVisible: boolean;
  url: string;
};

export async function addCaseItem(
  input: z.infer<typeof addCaseItemSchema>,
): Promise<ActionData<CreatedCaseItem>> {
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

  const created = await prisma.caseItem.create({
    data: {
      categoryId: parsed.data.categoryId,
      assetId: parsed.data.assetId,
      name: parsed.data.name,
      position: (last?.position ?? 0) + STEP,
    },
    select: {
      id: true,
      name: true,
      isVisible: true,
      asset: { select: { key: true } },
    },
  });

  revalidateContent("cases");
  return okWith({
    id: created.id,
    name: created.name,
    isVisible: created.isVisible,
    url: mediaUrl(created.asset.key),
  });
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
  media: { posterId: string; webmId: string; mp4Id: string; gifId: string },
): Promise<ActionResult> {
  await requireSession();
  await prisma.frameAnimation.update({ where: { id }, data: media });
  revalidateContent("frames");
  return ok();
}

/**
 * 刪除拍貼框，連同它的四個媒體檔案。
 *
 * 檔案要刪得謹慎：MediaAsset 以 checksum 去重，重複上傳同一個 GIF 會
 * 複用既有 asset，所以同一份影片可能被別的拍貼框共用。逐一確認沒有
 * 其他人引用才刪，否則會把還在用的影片從 S3 抹掉。
 *
 * S3 刪除失敗不讓整個操作失敗 —— 資料列已經刪了，這時回報錯誤只會讓
 * 使用者以為沒刪成功而重按。留下的孤兒檔案不影響網站，成本也極低。
 */
export async function removeFrameAnimation(id: string): Promise<ActionResult> {
  await requireSession();

  const frame = await prisma.frameAnimation.findUnique({
    where: { id },
    select: {
      posterId: true,
      webmId: true,
      mp4Id: true,
      gifId: true,
    },
  });
  if (!frame) return fail("找不到這個拍貼框");

  await prisma.frameAnimation.delete({ where: { id } });

  const assetIds = [
    frame.posterId,
    frame.webmId,
    frame.mp4Id,
    frame.gifId,
  ].filter((assetId): assetId is string => assetId !== null);

  for (const assetId of assetIds) {
    const stillUsed = await prisma.frameAnimation.count({
      where: {
        OR: [
          { posterId: assetId },
          { webmId: assetId },
          { mp4Id: assetId },
          { gifId: assetId },
        ],
      },
    });
    if (stillUsed > 0) continue;

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: { key: true },
    });
    if (!asset) continue;

    // 先刪資料列再刪檔案：其他表（主視覺、現場照、案例）也可能引用
    // 同一個 asset，那些關聯是 onDelete: Restrict，刪不掉就會在這裡拋錯。
    // 反過來先刪 S3 的話，檔案沒了、資料列卻還在，那筆資料就永久壞掉
    try {
      await prisma.mediaAsset.delete({ where: { id: assetId } });
    } catch (error) {
      console.error(`媒體仍被其他內容引用，保留（${asset.key}）`, error);
      continue;
    }

    try {
      await deleteObject(asset.key);
    } catch (error) {
      console.error(`S3 刪除失敗，留下孤兒檔案（${asset.key}）`, error);
    }
  }

  revalidateContent("frames");
  return ok();
}

const createFrameSchema = z.object({
  alt: z.string().trim().min(1, "請填寫描述文字"),
  posterId: z.string().min(1),
  webmId: z.string().min(1),
  mp4Id: z.string().min(1),
  gifId: z.string().min(1),
  /** 轉檔後的影片尺寸，用來推算版面寬高 */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type CreatedFrame = {
  id: string;
  slug: string;
  alt: string;
  posterUrl: string;
  webmUrl: string;
  mp4Url: string;
  gifUrl?: string;
  displayWidth: number;
  displayHeight: number;
  rotate: number;
  boxWidth: number;
  boxHeight: number;
  isVisible: boolean;
};

/** 網站上拍貼框的版面高度，與既有五組一致 */
const FRAME_DISPLAY_HEIGHT = 410;

export async function createFrameAnimation(
  input: z.infer<typeof createFrameSchema>,
): Promise<ActionData<CreatedFrame>> {
  await requireSession();
  const parsed = createFrameSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  const last = await prisma.frameAnimation.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  // slug 原本是 4grid／american 這類人工命名，供 S3 舊路徑對照追溯用。
  // 新增的沒有對應的舊路徑，故以時間戳產生 —— 它只需唯一，不需可讀
  const slug = `frame-${Date.now().toString(36)}`;

  // 版面高度固定 410，寬度照影片比例縮放，與既有五組的作法一致。
  // rotate 預設 0，box* 因而等於版面尺寸；要傾斜由使用者自己拉滑桿，
  // 拉動時前端會重算 box*
  const displayWidth = Math.round(
    (parsed.data.width / parsed.data.height) * FRAME_DISPLAY_HEIGHT,
  );

  const created = await prisma.frameAnimation.create({
    data: {
      slug,
      alt: parsed.data.alt,
      posterId: parsed.data.posterId,
      webmId: parsed.data.webmId,
      mp4Id: parsed.data.mp4Id,
      gifId: parsed.data.gifId,
      displayWidth,
      displayHeight: FRAME_DISPLAY_HEIGHT,
      rotate: 0,
      boxWidth: displayWidth,
      boxHeight: FRAME_DISPLAY_HEIGHT,
      position: (last?.position ?? 0) + STEP,
    },
    select: {
      id: true,
      slug: true,
      alt: true,
      displayWidth: true,
      displayHeight: true,
      rotate: true,
      boxWidth: true,
      boxHeight: true,
      isVisible: true,
      poster: { select: { key: true } },
      webm: { select: { key: true } },
      mp4: { select: { key: true } },
      gif: { select: { key: true } },
    },
  });

  revalidateContent("frames");
  return okWith({
    id: created.id,
    slug: created.slug,
    alt: created.alt,
    posterUrl: mediaUrl(created.poster.key),
    webmUrl: mediaUrl(created.webm.key),
    mp4Url: mediaUrl(created.mp4.key),
    gifUrl: created.gif ? mediaUrl(created.gif.key) : undefined,
    displayWidth: created.displayWidth,
    displayHeight: created.displayHeight,
    rotate: created.rotate,
    boxWidth: created.boxWidth,
    boxHeight: created.boxHeight,
    isVisible: created.isVisible,
  });
}

// ---------------------------------------------------------------------------
// 常見問題
// ---------------------------------------------------------------------------

const faqSchema = z.object({
  question: z.string().trim().min(1, "請填寫問題"),
  answer: z.string().trim().min(1, "請填寫答案"),
});

export type CreatedFaqItem = {
  id: string;
  question: string;
  answer: string;
  isVisible: boolean;
};

export async function createFaq(
  input: z.infer<typeof faqSchema>,
): Promise<ActionData<CreatedFaqItem>> {
  await requireSession();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "資料不正確");
  }

  const last = await prisma.faqItem.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const created = await prisma.faqItem.create({
    data: { ...parsed.data, position: (last?.position ?? 0) + STEP },
    select: { id: true, question: true, answer: true, isVisible: true },
  });

  revalidateContent("faq");
  return okWith(created);
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
});

/**
 * 產生一組隨機密碼。
 *
 * 由系統產生而非讓管理者自訂：人取的密碼通常偏弱，且這組密碼只需要
 * 傳給新同事一次，不必好記。刻意排除容易誤認的字元（0/O、1/l/I），
 * 因為它多半是用看的抄寫或口述轉達。
 *
 * 用 crypto.randomInt 而非 Math.random —— 後者不是密碼學安全的亂數源。
 */
function generatePassword(length = 16): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

/**
 * 新增後台帳號。
 *
 * auth.ts 設了 disableSignUp，對外的註冊端點是關閉的；這裡走 internal
 * adapter 直接建立，並以 requireSession() 確保只有已登入者能呼叫。
 */
export type CreateAccountResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

export async function createAccount(
  formData: FormData,
): Promise<CreateAccountResult> {
  await requireSession();

  const parsed = accountSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "資料不正確",
    };
  }

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return { ok: false, error: "這個 Email 已經有帳號了" };
  }

  const password = generatePassword();

  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser(
    { email, name: parsed.data.name, emailVerified: true },
    { method: "email-password" },
  );
  await ctx.internalAdapter.createAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await ctx.password.hash(password),
  });

  // 明文只在這一次回傳，資料庫存的是雜湊，之後無從取回
  return { ok: true, email, password };
}

export type ResetPasswordResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

/**
 * 重設別人的密碼。
 *
 * 密碼一律由系統產生：替別人指定一組自己知道的密碼，等於能無聲接管
 * 對方的帳號。要改自己的密碼請用 changeOwnPassword，那條路徑會驗原密碼。
 *
 * 流程與 Better Auth 自己的 reset-password 路由一致：先找 credential
 * account，有就更新、沒有就補建（例如帳號曾以其他方式建立）。
 */
export async function resetPassword(
  id: string,
): Promise<ResetPasswordResult> {
  const session = await requireSession();

  // 自己的密碼不走這裡 —— 這條路徑不驗原密碼，只該用於管理他人帳號
  if (session.user.id === id) {
    return { ok: false, error: "請用側邊欄的「修改密碼」變更自己的密碼" };
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { ok: false, error: "找不到這個帳號" };

  const password = generatePassword();
  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(password);

  const account = await ctx.internalAdapter.findCredentialAccount(id);
  if (account) {
    await ctx.internalAdapter.updatePassword(id, hashed);
  } else {
    await ctx.internalAdapter.createAccount({
      userId: id,
      providerId: "credential",
      accountId: id,
      password: hashed,
    });
  }

  // 舊密碼已失效，該帳號在其他裝置上的登入狀態也一併清掉，
  // 否則被交接的帳號仍可能停在別人手上的分頁裡
  await prisma.session.deleteMany({ where: { userId: id } });

  return { ok: true, email: user.email, password };
}

/**
 * 修改自己的密碼。
 *
 * 交給 Better Auth 的 changePassword：它會用同一套雜湊驗證原密碼，
 * 也會正確處理 session。自己實作等於複製一份驗證邏輯，將來兩邊會走鐘。
 *
 * 驗原密碼是必要的 —— 少了這一關，任何人只要碰到一台已登入的電腦，
 * 就能改掉密碼並把本人踢出其他所有裝置。
 */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  await requireSession();

  if (newPassword.length < 12) return fail("新密碼至少 12 個字元");

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        // 其他裝置上的登入以舊密碼建立，一併失效；
        // 目前這個視窗由 Better Auth 自己保留
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch {
    // Better Auth 對密碼錯誤與其他失敗都拋 APIError，
    // 不細分原因以免洩漏「這個帳號存在」之類的資訊
    return fail("目前的密碼不正確");
  }

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
