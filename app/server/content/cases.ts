import { unstable_cache } from "next/cache";
import { prisma } from "../db";
import { mediaUrl } from "../s3";
import { TAGS } from "./tags";

// 這兩個型別的值會跨越 RSC 邊界傳進 "use client" 的 CasesView，
// 故只能含純量與字串 —— Date、Decimal 等無法序列化。
// 日後若要加 updatedAt，必須先 toISOString()
export type CaseCategoryView = {
  id: string;
  slug: string;
  label: string;
  tagline: string;
  cover: string;
};

export type CaseItemView = {
  id: string;
  src: string;
  name: string;
};

async function loadCaseCategories(): Promise<CaseCategoryView[]> {
  const categories = await prisma.caseCategory.findMany({
    where: { isVisible: true, cover: { deletedAt: null } },
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      label: true,
      tagline: true,
      cover: { select: { key: true } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    tagline: category.tagline,
    cover: mediaUrl(category.cover.key),
  }));
}

/** 以 slug 分組的案例圖。CasesView 靠網址 hash 切分類，用 slug 當鍵最直接 */
async function loadCaseItemsBySlug(): Promise<Record<string, CaseItemView[]>> {
  const items = await prisma.caseItem.findMany({
    where: {
      isVisible: true,
      asset: { deletedAt: null },
      category: { isVisible: true },
    },
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
    select: {
      id: true,
      name: true,
      asset: { select: { key: true } },
      category: { select: { slug: true } },
    },
  });

  const grouped: Record<string, CaseItemView[]> = {};
  for (const item of items) {
    (grouped[item.category.slug] ??= []).push({
      id: item.id,
      src: mediaUrl(item.asset.key),
      name: item.name,
    });
  }
  return grouped;
}

export const getCaseCategories = unstable_cache(
  loadCaseCategories,
  ["content", "cases", "categories", "v1"],
  { tags: [TAGS.cases], revalidate: false },
);

export const getCaseItemsBySlug = unstable_cache(
  loadCaseItemsBySlug,
  ["content", "cases", "items", "v1"],
  { tags: [TAGS.cases], revalidate: false },
);
