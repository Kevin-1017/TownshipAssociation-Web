import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "广工胶己人 · 广东工业大学潮阳潮南校友会",
  description:
    "广工胶己人是广东工业大学潮阳潮南校友会的信息展示平台，展示公告通知、乡情活动信息与教育基金会捐赠、奖励公开数据。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
