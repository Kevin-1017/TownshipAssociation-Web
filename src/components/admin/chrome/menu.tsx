"use client";

import type { ReactElement } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "tdesign-react";
import MenuLogo from "./menu-logo";
import { useAdminUI } from "../shared/ui-state";
import style from "./menu.module.css";

const { MenuItem, SubMenu } = Menu;

const BOTTOM_TEXT = "TSA Admin v0.1.0";

export interface StarterMenuItem {
  path: string;
  label: string;
  icon?: ReactElement;
  /** 二级菜单项（如社区审核按栏目拆分）；当前 value 命中子项时 SubMenu 自动展开 */
  children?: StarterMenuItem[];
}

interface IMenuProps {
  items: StarterMenuItem[];
  showLogo?: boolean;
  showOperation?: boolean;
}

/** 左侧菜单：平铺菜单项渲染，含二级 SubMenu */
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
      {items.map((item) =>
        item.children?.length ? (
          <SubMenu key={item.path} value={item.path} icon={item.icon} title={item.label}>
            {item.children.map((child) => (
              <MenuItem
                key={child.path}
                value={child.path}
                onClick={() => router.push(child.path)}
              >
                {child.label}
              </MenuItem>
            ))}
          </SubMenu>
        ) : (
          <MenuItem key={item.path} value={item.path} icon={item.icon} onClick={() => router.push(item.path)}>
            {item.label}
          </MenuItem>
        ),
      )}
    </Menu>
  );
}
