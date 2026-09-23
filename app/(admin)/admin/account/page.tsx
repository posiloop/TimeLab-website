import { headers } from "next/headers";
import { auth } from "@/app/server/auth";
import { prisma } from "@/app/server/db";
import AccountManager from "./AccountManager";

export default async function AccountAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <AccountManager
      currentUserId={session?.user.id ?? ""}
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        // Date 無法跨越 RSC 邊界，先轉成字串
        createdAt: user.createdAt.toLocaleDateString("zh-TW"),
      }))}
    />
  );
}
