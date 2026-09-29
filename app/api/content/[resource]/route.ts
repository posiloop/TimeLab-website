import { NextResponse } from "next/server";
import { verifyApiKey } from "@/app/server/api-key";
import { prisma } from "@/app/server/db";
import { revalidateContent } from "@/app/server/content/revalidate";
import { definitionOf, isResource, resourceList } from "../schema";
import { buildCreateData, serialise, type AnyDelegate } from "../handler";

export const runtime = "nodejs";

/** 排序採間隔 1000 的稀疏配置，與後台 action 及遷移腳本一致 */
const STEP = 1000;

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

  const rows = await table.findMany({ orderBy: { position: "asc" } });

  return NextResponse.json({
    resource,
    count: rows.length,
    items: rows.map(serialise),
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求主體不是有效的 JSON" }, { status: 400 });
  }

  const definition = definitionOf(resource);
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

  const table = prisma[definition.model as keyof typeof prisma] as unknown as AnyDelegate;

  // position 接在同範圍的最後一筆之後。hero/events 依 track、cases 依分類
  // 各自連號，取錯範圍會撞 @@unique
  const input = parsed.data as Record<string, unknown>;
  const scope = definition.scopedBy
    ? { [definition.scopedBy]: input[definition.scopedBy] }
    : {};
  const last = await table.findFirst({
    where: scope,
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const data = buildCreateData(resource, parsed.data, {
    position: ((last?.position as number) ?? 0) + STEP,
  });

  let created;
  try {
    created = await table.create({ data });
  } catch (error) {
    // 最常見的是 assetId 指向不存在的檔案（外鍵），訊息要說得出是哪裡錯，
    // 否則對接的人只會看到一串 Prisma 內部錯誤
    return NextResponse.json(
      { error: describeWriteError(error) },
      { status: 409 },
    );
  }

  revalidateContent(definition.section);

  return NextResponse.json({ item: serialise(created) }, { status: 201 });
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
