import type { Metadata } from "next";
import "tdesign-react/es/style/index.css";
// 后台全局设计 token(圆角与官网对齐等)，仅 (admin) 组加载；CSS 导入可以出现在 Server Component，
// React 19 的 TDesign 适配器导入在客户端模块 AdminShell 中，勿挪到此处。
import "@/components/admin/starter/admin-theme.css";
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
