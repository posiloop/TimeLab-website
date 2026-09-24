import { notFound } from "next/navigation";
import { prisma } from "@/app/server/db";
import { mediaUrl } from "@/app/server/s3";
import CaseItemsEditor from "./CaseItemsEditor";

export default async function CaseCategoryPage({
  params,
}: PageProps<"/admin/cases/[slug]">) {
  // Next 16 起 params 一律是 Promise，必須 await
  const { slug } = await params;

  const category = await prisma.caseCategory.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      label: true,
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          isVisible: true,
          asset: { select: { key: true } },
        },
      },
    },
  });

  if (!category) notFound();

  return (
    <CaseItemsEditor
      category={{ id: category.id, slug: category.slug, label: category.label }}
      items={category.items.map((item) => ({
        id: item.id,
        name: item.name,
        isVisible: item.isVisible,
        url: mediaUrl(item.asset.key),
      }))}
    />
  );
}
