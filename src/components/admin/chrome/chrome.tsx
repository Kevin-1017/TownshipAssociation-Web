"use client";

/**
 * 后台框架外壳（侧边布局）：左侧栏菜单 + 顶栏 + 内容页 + 页脚。
 * bare=true 时不套框架(登录页/守卫跳转中的占位)。
 */
import type { ReactNode } from "react";
import { Layout } from "tdesign-react";
import SideMenu, { type StarterMenuItem } from "./menu";
import AdminHeader from "./header";
import AdminFooter from "./footer";
import AdminPage from "./page";
import shellStyle from "./shell.module.css";
import appLayoutStyle from "./app-layout.module.css";

interface IProps {
  children: ReactNode;
  /** 不套框架；bare 时以下各项不生效 */
  bare?: boolean;
  items?: StarterMenuItem[];
  username?: string;
  onLogout?: () => void;
  /** 面包屑(本站单层菜单，传当前页标题即可) */
  breadcrumb?: string[];
}

export default function AdminChrome({
  children,
  bare,
  items = [],
  username = "",
  onLogout = () => {},
  breadcrumb,
}: IProps) {
  if (bare) {
    return <Layout className={shellStyle.panel}>{children}</Layout>;
  }

  return (
    <Layout className={shellStyle.panel}>
      <Layout className={appLayoutStyle.sidePanel}>
        <SideMenu items={items} showLogo showOperation />
        <Layout className={appLayoutStyle.sideContainer}>
          <AdminHeader username={username} onLogout={onLogout} />
          <AdminPage breadcrumbs={breadcrumb}>{children}</AdminPage>
          <AdminFooter />
        </Layout>
      </Layout>
    </Layout>
  );
}
