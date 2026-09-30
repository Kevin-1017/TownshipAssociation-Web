import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteFooter from "@/components/site/layout/site-footer";
import SiteHeader from "@/components/site/layout/site-header";
import "./site.css";
import "./site-atoms.css";

/** 官网组的标题模板：子页只写业务名，品牌后缀自动拼接 */
export const metadata: Metadata = {
  title: {
    default: "广工胶己人 · 广东工业大学潮阳潮南校友会",
    template: "%s · 广工胶己人",
  },
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-root flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-1 focus:text-sm"
      >
        跳到主要内容
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* footer 的渐显上浮做在组件内部（各栏错峰），此处不再整块包裹 */}
      <SiteFooter />
    </div>
  );
}
