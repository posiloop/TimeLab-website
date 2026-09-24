import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/app/components/admin/AdminShell";
import { auth } from "@/app/server/auth";

export const metadata: Metadata = {
  title: "網站內容管理｜TiMELAB",
  // 後台不該出現在搜尋結果；robots.ts 另有一份 disallow
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  // proxy.ts 只確認 cookie 存不存在，這裡才驗證簽章並查資料庫。
  // 兩層都要：proxy 擋住大部分無效流量，這裡才是真正的防線
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <AdminShell userName={session.user.name} userEmail={session.user.email}>
      {children}
    </AdminShell>
  );
}
