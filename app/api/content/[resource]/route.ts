import { NextResponse } from "next/server";
import { verifyApiKey } from "@/app/server/api-key";
import { API_ACTOR, recordAudit } from "@/app/server/audit";
import { prisma } from "@/app/server/db";
import { revalidateContent } from "@/app/server/content/revalidate";
import { STEP } from "@/app/server/content/reorder";
import { definitionOf, isResource, resourceList } from "../schema";
import {
  buildCreateData,
  EVENT_DISPLAY_HEIGHT,
  INCLUDE,
  present,
  type AnyDelegate,
} from "../handler";
import { createHero } from "../hero";

export const runtime = "nodejs";

/**
 * 內容 API 的集合端點。
 *
 * GET  /api/content/<resource>  列出項目
 * POST /api/content/<resource>  新增一筆
 *
 * 與後台的 server action 並存而非取代：action 由瀏覽器帶 session cookie
 * 呼叫，這裡由外部系統帶 Bearer 金鑰呼叫。兩者寫入同一份資料、共用同一組
 * 驗證規則與同一個失效入口，差別只在誰有資格呼叫。
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const denied = verifyApiKey(request);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }

  const { resource } = await params;
  if (!isResource(resource)) {
    return NextResponse.json(
      { error: `未知的資源，可用：${resourceList.join("、")}` },
      { status: 404 },
    );
  }

  const definition = definitionOf(resource);
  const table = prisma[definition.model as keyof typeof prisma] as unknown as AnyDelegate;

  // 分軌或分類的資源先依範圍排，再依 position —— 三排的 position 都從
  // 1000 起跳，只排 position 的話同值的幾筆先後由資料庫決定，每次讀到
  // 的順序可能不同，對方據此組出的排序清單也會跟著亂
  const orderBy =
    definition.scopedBy === "track"
      ? [{ track: "asc" }, { position: "asc" }]
      : definition.scopedBy === "categoryId"
        ? [{ category: { position: "asc" } }, { position: "asc" }]
        : { position: "asc" };

  const rows = await table.findMany({ orderBy, include: INCLUDE[resource] });

  return NextResponse.json({
    resource,
    count: rows.length,
    items: rows.map((row) => present(resource, row)),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const denied = verifyApiKey(request);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }

  const { resource } = await params;
  if (!isResource(resource)) {
    return NextResponse.json(
      { error: `未知的資源，可用：${resourceList.join("、")}` },
      { status: 404 },
    );
  }

  const definition = definitionOf(resource);
  if (!definition.create) {
    return NextResponse.json(
      { error: "這個資源不開放新增，只能讀取與修改" },
      { status: 405, headers: { Allow: "GET" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求主體不是有效的 JSON" }, { status: 400 });
  }

  const parsed = definition.create.safeParse(body);
  if (!parsed.success) {
    // 回報所有有問題的欄位而非只回第一個 —— 外部整合是寫程式的人在對接，
    // 一次看到全部才不必反覆試誤
    return NextResponse.json(
      {
        error: "資料不正確",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  if (resource === "hero") {
    const result = await createHero(
      parsed.data as { assetId: string; alt?: string; isVisible: boolean },
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    await recordAudit({
      actor: API_ACTOR,
      action: "create",
      resource,
      after: result.body,
    });
    revalidateContent(definition.section);
    return NextResponse.json(result.body, { status: result.status });
  }

  let input = parsed.data as Record<string, unknown>;

  if (resource === "events") {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: input.assetId as string },
      select: { mimeType: true, intrinsicWidth: true, intrinsicHeight: true },
    });
    if (!asset) {
      return NextResponse.json(
        { error: "關聯的項目不存在 —— 請確認 assetId 是有效的 ID" },
        { status: 409 },
      );
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) {
      return NextResponse.json(
        { error: `這個檔案是 ${asset.mimeType}，現場照只能用 JPG、PNG 或 WebP` },
        { status: 422 },
      );
    }
    // 高度統一、寬度照比例，與後台 EventsEditor 新增時同一個算法
    input = {
      ...input,
      displayHeight: EVENT_DISPLAY_HEIGHT,
      displayWidth: Math.round(
        (asset.intrinsicWidth / asset.intrinsicHeight) * EVENT_DISPLAY_HEIGHT,
      ),
    };
  }

  const table = prisma[definition.model as keyof typeof prisma] as unknown as AnyDelegate;

  // position 接在同範圍的最後一筆之後。hero/events 依 track、cases 依分類
  // 各自連號，取錯範圍會撞 @@unique
  const scope = definition.scopedBy
    ? { [definition.scopedBy]: input[definition.scopedBy] }
    : {};
  const last = await table.findFirst({
    where: scope,
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const data = buildCreateData(resource, input, {
    position: ((last?.position as number) ?? 0) + STEP,
  });

  let created;
  try {
    created = await table.create({ data, include: INCLUDE[resource] });
  } catch (error) {
    // 最常見的是 assetId 指向不存在的檔案（外鍵），訊息要說得出是哪裡錯，
    // 否則對接的人只會看到一串 Prisma 內部錯誤
    return NextResponse.json(
      { error: describeWriteError(error) },
      { status: 409 },
    );
  }

  await recordAudit({
    actor: API_ACTOR,
    action: "create",
    resource,
    targetId: created.id as string,
    after: created,
  });
  revalidateContent(definition.section);

  return NextResponse.json({ item: present(resource, created) }, { status: 201 });
}

/**
 * 把 Prisma 的寫入錯誤翻成對接的人看得懂的句子。
 *
 * 只處理外部真的碰得到的兩種：指到不存在的 asset/分類（P2003），
 * 以及撞上唯一約束（P2002）。其餘照實回傳代碼，不臆測成因。
 */
function describeWriteError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  if (code === "P2003") {
    return "關聯的項目不存在 —— 請確認 assetId／categoryId 是有效的 ID";
  }
  if (code === "P2002") {
    return "與現有項目衝突，請稍後重試";
  }
  return `寫入失敗${code ? `（${code}）` : ""}`;
}
