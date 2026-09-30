import { prisma } from "../db";

/**
 * 排序採間隔 1000 的稀疏配置，與遷移腳本一致。
 *
 * 後台的 server action 與內容 API 都從這裡取值 —— 兩個入口若各用各的
 * 間隔，從不同入口新增的項目會排在出乎意料的位置
 */
export const STEP = 1000;

export type Reorderable =
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
  findMany(args: {
    where: { id: { in: string[] } };
    orderBy: { position: "asc" };
    select: { id: true };
  }): Promise<{ id: string }[]>;
};

/**
 * 整軌重新編號。
 *
 * 一次送整排而非每拖一次打一次 API：後者會讓使用者調整 12 張順序時
 * 觸發數十次前台失效，且無法取消。
 *
 * position 有 @@unique 約束，中途狀態會撞鍵，故必須包在交易裡並先挪到
 * 負數區 —— 負數不會與正式值衝突，交易結束前就會全部改寫完畢。
 *
 * 呼叫端負責確保 ids 剛好是同一範圍（同一軌、同一分類或整張表）的
 * 全部項目。少送幾筆，新編號會撞上沒送的那幾筆；混送兩軌，兩軌會被
 * 編進同一組連號。這裡不檢查，因為後台的前端永遠送整排，檢查只在
 * 外部入口需要。
 *
 * 回傳排序前的順序，供稽核紀錄使用 —— 排錯了要能照原樣排回去
 */
export async function reorder(
  model: Reorderable,
  ids: string[],
): Promise<string[]> {
  return prisma.$transaction(async (tx) => {
    const table = tx[model] as unknown as PositionUpdater;
    const previous = await table.findMany({
      where: { id: { in: ids } },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const update = (id: string, position: number) =>
      table.update({ where: { id }, data: { position } });

    // 先全部挪到負數區：position 有唯一約束，依序改寫會在中途撞鍵，
    // 而負數不可能與正式值衝突
    for (const [index, id] of ids.entries()) await update(id, -(index + 1));
    for (const [index, id] of ids.entries()) await update(id, (index + 1) * STEP);
    return previous.map((row) => row.id);
  });
}
