import { PreviewableImage } from "@/app/components/admin/ImagePreview";
import { requireSession } from "@/app/server/admin-guard";
import { prisma } from "@/app/server/db";
import { explain, loadContext, type Item } from "./describe";

/** 一次只列最近這麼多筆；要查更早的請直接查 audit_log 表 */
const LIMIT = 200;

const RESOURCE_LABEL: Record<string, string> = {
  hero: "首頁主視覺",
  frames: "拍貼框動畫",
  cases: "活動案例",
  categories: "案例分類",
  faq: "常見問題",
  events: "活動現場照",
  account: "帳號",
};

const ACTION_LABEL: Record<string, string> = {
  create: "新增",
  update: "修改",
  delete: "刪除",
  reorder: "排序",
  "replace-media": "更換圖片／影片",
  "reset-password": "重設密碼",
  "change-password": "修改自己的密碼",
};

export default async function AuditLogPage() {
  // 紀錄裡有帳號 email 與刪掉的內容，不只靠 layout 的檢查
  await requireSession();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });
  const context = await loadContext(logs);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-h2 text-brand-ink">操作紀錄</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          後台與內容 API 的每一次異動，最新的在最上面，只列最近 {LIMIT} 筆。
          改錯或誤刪時，可展開「原始資料」照異動前的內容還原。
        </p>
      </div>

      {logs.length === 0 && (
        <p className="text-sm text-brand-ink/60">還沒有任何紀錄。</p>
      )}

      <ul className="flex flex-col gap-2">
        {logs.map((log) => {
          const { subject, changes, fields, moves, note } = explain(log, context);
          return (
            <li
              key={log.id}
              className="card-surface flex flex-col gap-3 rounded-[10px] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                {subject?.thumb && (
                  <Thumb src={subject.thumb} caption={subject.title} size="lg" />
                )}
                <div className="min-w-0 text-sm text-brand-ink">
                  <p>
                    <span className="font-bold">
                      {log.actor === "API_KEY"
                        ? "內容 API 金鑰"
                        : (log.actorEmail ?? "已刪除的帳號")}
                    </span>
                    {"　"}
                    {ACTION_LABEL[log.action] ?? log.action}
                    {"　"}
                    {RESOURCE_LABEL[log.resource] ?? log.resource}
                  </p>
                  {subject && (
                    <p className="line-clamp-2 font-bold break-all">
                      {subject.title}
                    </p>
                  )}
                  <p className="text-caption text-brand-ink/60">
                    {/* 伺服器跑在 UTC，不指定時區會差 8 小時 */}
                    {log.createdAt.toLocaleString("zh-TW", {
                      timeZone: "Asia/Taipei",
                    })}
                  </p>
                </div>
              </div>

              {note && <p className="text-caption text-brand-ink/60">{note}</p>}

              {changes && (
                <dl className="flex flex-col gap-2">
                  {changes.map((change) => (
                    <div
                      key={change.label}
                      className="grid gap-1 text-sm md:grid-cols-[7rem_1fr]"
                    >
                      <dt className="text-brand-ink/60">{change.label}</dt>
                      <dd className="flex flex-wrap items-center gap-2">
                        <Value item={change.before} muted />
                        <span aria-label="改為" className="text-brand-ink/40">
                          →
                        </span>
                        <Value item={change.after} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {fields && fields.length > 0 && (
                <dl className="flex flex-col gap-1">
                  {fields.map((field) => (
                    <div
                      key={field.label}
                      className="grid gap-1 text-sm md:grid-cols-[7rem_1fr]"
                    >
                      <dt className="text-brand-ink/60">{field.label}</dt>
                      <dd>
                        <Value item={field.value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {moves && (
                <ul className="flex flex-col gap-1">
                  {moves.map((move, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {move.item.thumb && (
                        <Thumb src={move.item.thumb} caption={move.item.title} />
                      )}
                      <span className="min-w-0 truncate">{move.item.title}</span>
                      <span className="shrink-0 text-brand-ink/60">
                        從第 {move.from} 移到第 {move.to}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <details className="text-caption">
                <summary className="cursor-pointer text-brand-ink/60">
                  原始資料
                </summary>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <Snapshot label="異動前" value={log.before} />
                  <Snapshot label="異動後" value={log.after} />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Value({ item, muted }: { item: Item; muted?: boolean }) {
  return (
    <span
      className={`flex min-w-0 items-center gap-2 whitespace-pre-wrap break-all ${
        muted ? "text-brand-ink/50" : ""
      }`}
    >
      {item.thumb && <Thumb src={item.thumb} caption={item.title} />}
      {item.title}
    </span>
  );
}

/** 點擊放大，與其他後台頁的縮圖同一套預覽 */
function Thumb({
  src,
  caption,
  size,
}: {
  src: string;
  caption: string;
  size?: "lg";
}) {
  return (
    <PreviewableImage
      src={src}
      caption={caption}
      className={`shrink-0 rounded-[6px] border border-black/10 object-cover ${
        size === "lg" ? "h-16 w-12" : "h-10 w-8"
      }`}
    />
  );
}

function Snapshot({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="text-brand-ink/60">{label}</p>
      <pre className="mt-1 max-h-80 overflow-auto rounded-[8px] bg-brand-mist p-3">
        {value == null ? "（無）" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
