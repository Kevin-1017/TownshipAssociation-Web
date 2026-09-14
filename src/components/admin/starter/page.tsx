"use client";

import type { ReactNode } from "react";
import { Breadcrumb } from "tdesign-react";
import style from "./page.module.css";

const { BreadcrumbItem } = Breadcrumb;

/**
 * 内容页容器(模板 Page.tsx + AppRouter 的 Content 合并)：
 * 外边距 24px + 面包屑(本站单层菜单，面包屑即当前页标题；「显示 Breadcrumbs」开关随主题配置移除)。
 */
export default function AdminPage({ children, breadcrumbs }: { children: ReactNode; breadcrumbs?: string[] }) {
  return (
    <div className={style.panel}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className={style.breadcrumb}>
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem key={index}>{item}</BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}
      {children}
    </div>
  );
}
