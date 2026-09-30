import { prisma } from "./db";

/**
 * 誰做的。後台用 session 的使用者，內容 API 用金鑰。
 *
 * email 跟著存一份：帳號被刪後 actorId 會被設成 null，
 * 少了這份快照，紀錄就只剩「某個已不存在的人」。
 */
export type Actor =
  | { type: "USER"; userId: string; email: string }
  | { type: "API_KEY" };

export const API_ACTOR: Actor = { type: "API_KEY" };

export function userActor(session: {
  user: { id: string; email: string };
}): Actor {
  return { type: "USER", userId: session.user.id, email: session.user.email };
}

export type AuditEntry = {
  actor: Actor;
  action: string;
  resource: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
};

/**
 * 留下一筆異動紀錄。
 *
 * 在異動成功之後才呼叫，且寫入失敗只記進 log 不往外拋 —— 內容已經改好了，
 * 這時回報失敗只會讓使用者以為沒改成而重按。代價是資料庫短暫故障時會
 * 漏記，那一筆仍可從伺服器 log 的錯誤訊息找回來。
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const { actor } = entry;
  try {
    await prisma.auditLog.create({
      data: {
        actor: actor.type,
        actorId: actor.type === "USER" ? actor.userId : null,
        actorEmail: actor.type === "USER" ? actor.email : null,
        action: entry.action,
        resource: entry.resource,
        targetId: entry.targetId,
        before: toJson(entry.before),
        after: toJson(entry.after),
      },
    });
  } catch (error) {
    console.error("稽核紀錄寫入失敗", JSON.stringify(entry), error);
  }
}

/**
 * 轉成純 JSON。Prisma 的 Json 欄位不收 Date，
 * 而資料列幾乎都帶 createdAt／updatedAt。
 *
 * null 也當成沒有：Json? 欄位收到裸的 null 會拋錯，要用 Prisma.DbNull，
 * 而「沒有這筆」與「欄位留空」在這裡沒有差別
 */
function toJson(value: unknown) {
  return value == null ? undefined : JSON.parse(JSON.stringify(value));
}

/** 異動前的整筆資料。model 名稱與 prisma 上的 delegate 名一致 */
export async function snapshot(
  model: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  const table = prisma[model as keyof typeof prisma] as unknown as {
    findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
  };
  return table.findUnique({ where: { id } });
}
