import Link from "next/link";
import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import CategoryCard from "./CategoryCard";

export default async function CasesAdminPage() {
  const categories = await prisma.caseCategory.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      label: true,
      tagline: true,
      cover: { select: { key: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-h2 text-brand-ink">活動案例</h1>
        <p className="mt-1 text-sm text-brand-ink/70">
          五個分類的名稱、副標與封面圖。點進分類可以管理裡面的案例照片。
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard
              category={{
                id: category.id,
                slug: category.slug,
                label: category.label,
                tagline: category.tagline,
                coverUrl: mediaUrl(category.cover.key),
                itemCount: category._count.items,
              }}
            />
          </li>
        ))}
      </ul>

      <p className="text-caption text-brand-ink/60">
        分類的網址代號（{categories.map((c) => c.slug).join("、")}）不開放修改
        —— 它被首頁的連結、社群貼文與名片上的網址依賴，改了之後舊連結會導向錯誤的分類。
      </p>

      <Link
        href="/admin"
        className="self-start text-caption text-brand hover:underline"
      >
        ← 回總覽
      </Link>
    </div>
  );
}
