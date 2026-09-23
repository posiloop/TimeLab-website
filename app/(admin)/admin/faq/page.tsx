import { prisma } from "@/app/server/db";
import FaqEditor from "./FaqEditor";

export default async function FaqAdminPage() {
  const items = await prisma.faqItem.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      question: true,
      answer: true,
      isVisible: true,
    },
  });

  return <FaqEditor items={items} />;
}
