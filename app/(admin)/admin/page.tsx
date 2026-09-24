import { redirect } from "next/navigation";

/**
 * 後台沒有總覽頁 —— 左側選單已經是導覽，再放一頁卡片只是重複點一次。
 *
 * 但 /admin 仍是登入後的落點與既有書籤的網址，故保留此路由並轉到
 * 第一個管理頁，而不是讓它 404。
 */
export default function AdminIndex() {
  redirect("/admin/hero");
}
