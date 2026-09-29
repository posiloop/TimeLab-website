import { NextResponse } from "next/server";
import { verifyApiKey } from "@/app/server/api-key";
import { prisma } from "@/app/server/db";
import { revalidateContent } from "@/app/server/content/revalidate";
import { definitionOf, isResource, resourceList } from "../../schema";
import { buildUpdateData, serialise, type AnyDelegate } from "../../handler";

export const runtime = "nodejs";

/**
 * 單一項目的讀取、更新與刪除。
 *
 * GET    /api/content/<resource>/<id>
 * PATCH  /api/content/<resource>/<id>   只改送來的欄位
 * DELETE /api/content/<resource>/<id>
 *
 * 用 PATCH 而非 PUT：外部系統多半只想改一個欄位（例如把某張照片下架），
 * PUT 的語義要求送出完整資源，漏送的欄位會被清成預設值。
 */

type Context = { params: Promise<{ resource: string; id: string }> };

/** 四個方法都要先過的同一組檢查，回傳查得到的 delegate 或錯誤回應 */
async function resolve(request: Request, context: Context) {
  const denied = verifyApiKey(request);
  if (denied) {
    return {
      error: NextResponse.json({ error: denied.error }, { status: denied.status }),
    };
  }

  const { resource, id } = await context.params;
  if (!isResource(resource)) {
    return {
      error: NextResponse.json(
        { error: `未知的資源，可用：${resourceList.join("、")}` },
        { status: 404 },
      ),
    };
  }

  const definition = definitionOf(resource);
  const table = prisma[definition.model as keyof typeof prisma] as unknown as AnyDelegate;
  const row = await table.findUnique({ where: { id } });

  if (!row) {
    return {
      error: NextResponse.json({ error: "找不到這筆項目" }, { status: 404 }),
    };
  }

  return { resource, id, definition, table, row };
}

export async function GET(request: Request, context: Context) {
  const resolved = await resolve(request, context);
  if (resolved.error) return resolved.error;

  return NextResponse.json({ item: serialise(resolved.row) });
}

export async function PATCH(request: Request, context: Context) {
  const resolved = await resolve(request, context);
  if (resolved.error) return resolved.error;

  const { resource, id, definition, table, row } = resolved;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "請求主體不是有效的 JSON" },
      { status: 400 },
    );
  }

  const parsed = definition.update.safeParse(body);
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

  // 空物件代表沒有任何可改的欄位 —— 多半是送錯欄位名（例如想改 slug
  // 或 position），靜默回成功會讓對接的人以為改掉了
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "沒有可更新的欄位 —— 請確認欄位名稱，部分欄位不開放修改" },
      { status: 422 },
    );
  }

  const data = buildUpdateData(resource, parsed.data, row);
  const updated = await table.update({ where: { id }, data });

  revalidateContent(definition.section);
  return NextResponse.json({ item: serialise(updated) });
}

export async function DELETE(request: Request, context: Context) {
  const resolved = await resolve(request, context);
  if (resolved.error) return resolved.error;

  const { id, definition, table } = resolved;

  try {
    await table.delete({ where: { id } });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    // 分類底下還有案例照時會被外鍵擋下。這裡刪的是 caseItem 而非分類，
    // 照理不會遇到，但 model 是查表決定的，留著訊息比較誠實
    if (code === "P2003") {
      return NextResponse.json(
        { error: "還有其他項目依賴這筆資料，無法刪除" },
        { status: 409 },
      );
    }
    throw error;
  }

  revalidateContent(definition.section);

  // 刪除只回結果不回內容 —— 東西已經不在了，回傳它的欄位只會讓人
  // 以為還查得到。
  //
  // 刻意不連帶刪除 S3 的媒體檔：後台的 removeFrameAnimation 會清掉不再
  // 被引用的 asset，這裡不跟進。外部系統誤刪一筆內容，重新 POST 一次就能
  // 復原（asset 還在，上傳端點本來就以 checksum 去重）；連檔案一起刪掉
  // 就真的救不回來了。代價是留下沒有內容引用的 asset，那是可以事後清理的
  // 磁碟空間，比不可逆的資料遺失便宜得多
  return NextResponse.json({ deleted: id });
}
