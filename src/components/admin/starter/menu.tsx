"use client";

import type { ReactElement } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "tdesign-react";
import MenuLogo from "./menu-logo";
import { useAdminUI } from "./ui-state";
import style from "./menu.module.css";

const { MenuItem } = Menu;

const BOTTOM_TEXT = "TSA Admin v0.1.0";

export interface StarterMenuItem {
  path: string;
  label: string;
  icon?: ReactElement;
}

interface IMenuProps {
  items: StarterMenuItem[];
  showLogo?: boolean;
  showOperation?: boolean;
}

/** 左侧菜单(模板 Menu 默认导出；路由树改为本站平铺菜单项) */
export default function SideMenu({ items, showLogo = true, showOperation = true }: IMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useAdminUI();

  return (
    <Menu
      width="232px"
      style={{ flexShrink: 0, height: "100%" }}
      value={pathname}
      collapsed={collapsed}
      operations={showOperation ? <div className={style.menuTip}>{BOTTOM_TEXT}</div> : undefined}
      logo={showLogo ? <MenuLogo collapsed={collapsed} /> : undefined}
    >
      {items.map((item) => (
        <MenuItem key={item.path} value={item.path} icon={item.icon} onClick={() => router.push(item.path)}>
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
