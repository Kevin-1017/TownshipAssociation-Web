import type { Metadata } from "next";
import "tdesign-react/es/style/index.css";
import AdminShell from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "管理后台 · 广工胶己人",
  description: "广工胶己人（广东工业大学潮阳潮南校友会）管理后台。",
};

/**
 * 管理后台组布局：引入 TDesign 全量样式，挂 QueryClientProvider + 登录守卫 + 后台框架。
 * 注意 /admin/login 也在本 layout 之下，守卫在 AdminShell 内对该路径放行。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
