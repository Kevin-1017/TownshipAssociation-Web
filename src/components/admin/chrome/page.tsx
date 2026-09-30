"use client";

import type { ReactNode } from "react";
import { Breadcrumb } from "tdesign-react";
import style from "./page.module.css";

const { BreadcrumbItem } = Breadcrumb;

/**
 * 内容页容器：外边距 24px + 面包屑(本站单层菜单，面包屑即当前页标题)。
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
