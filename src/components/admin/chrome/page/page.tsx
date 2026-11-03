"use client";

import type { ReactNode } from "react";
import style from "./page.module.css";

/**
 * 内容页容器：外边距 24px + 页面标题（由外壳按当前路由的菜单 label 下发，见 admin-shell）。
 * 标题即原面包屑的位置与职责：全站唯一一处页名，页面内不再各自写 h1。
 */
export default function AdminPage({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className={style.panel}>
      {title && <h1 className={style.title}>{title}</h1>}
      {children}
    </div>
  );
}
