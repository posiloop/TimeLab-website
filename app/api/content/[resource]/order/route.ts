import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey } from "@/app/server/api-key";
import { API_ACTOR, recordAudit } from "@/app/server/audit";
import { prisma } from "@/app/server/db";
import { reorder } from "@/app/server/content/reorder";
import { revalidateContent } from "@/app/server/content/revalidate";
import { definitionOf, isResource, resourceList } from "../../schema";
import type { AnyDelegate } from "../../handler";

export const runtime = "nodejs";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "請提供至少一個 id"),
});

/**
 * 重新排序。
 *
 * PUT /api/content/<resource>/order   { "ids": [ ... ] }
 *
 * ids 是新的完整順序。主視覺與現場照一次排一軌、案例照一次排一個分類，
 * 常見問題與拍貼框一次排全部 —— 與後台的拖曳清單一一對應。
 *
 * 用 PUT：送出的是這個範圍的整份順序，重送同一份結果不變。
 */
export async function PUT(
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
  if (!definition.reorderAs) {
    return NextResponse.json(
      { error: "這個資源不開放排序" },
      { status: 405 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "請求主體不是有效的 JSON" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
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

  const { ids } = parsed.data;
  const problem = await checkCompleteScope(
    definition.model,
    definition.scopedBy,
    ids,
  );
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 422 });
  }

  const previous = await reorder(definition.reorderAs, ids);
  await recordAudit({
    actor: API_ACTOR,
    action: "reorder",
    resource,
    before: { ids: previous },
    after: { ids },
  });
  revalidateContent(definition.section);

  return NextResponse.json({ resource, order: ids });
}

/**
 * 確認 ids 剛好是同一範圍的全部項目。
 *
 * 後台的前端永遠送整排，reorder() 因此不自己檢查；但外部呼叫方可能只送
 * 想移動的那幾筆，或把兩軌混在一起。前者會讓新編號撞上沒送的項目而整筆
 * 交易失敗，後者會把兩軌編進同一組連號 —— 都要在寫入前擋下，並說清楚
 * 缺了什麼，對方才知道怎麼補。
 *
 * 通過回 null，否則回可直接給對方看的原因。
 */
async function checkCompleteScope(
  model: string,
  scopedBy: "track" | "categoryId" | undefined,
  ids: string[],
): Promise<string | null> {
  if (new Set(ids).size !== ids.length) {
    return "ids 裡有重複的項目";
  }

  const table = prisma[model as keyof typeof prisma] as unknown as AnyDelegate;
  const select = scopedBy ? { id: true, [scopedBy]: true } : { id: true };

  const found = await table.findMany({
    where: { id: { in: ids } },
    select,
  });
  if (found.length !== ids.length) {
    const known = new Set(found.map((row) => row.id));
    const missing = ids.filter((id) => !known.has(id));
    return `找不到這些項目：${missing.join("、")}`;
  }

  let scope: Record<string, unknown> = {};
  if (scopedBy) {
    const values = new Set(found.map((row) => row[scopedBy]));
    if (values.size > 1) {
      const label = scopedBy === "track" ? "同一排" : "同一個分類";
      return `ids 必須全部屬於${label}，一次只能排一個範圍`;
    }
    scope = { [scopedBy]: found[0][scopedBy] };
  }

  const all = await table.findMany({ where: scope, select: { id: true } });
  if (all.length !== ids.length) {
    const sent = new Set(ids);
    const left = all.map((row) => row.id as string).filter((id) => !sent.has(id));
    return `必須送出這個範圍的完整順序，還缺 ${left.length} 筆：${left.join("、")}`;
  }

  return null;
}
