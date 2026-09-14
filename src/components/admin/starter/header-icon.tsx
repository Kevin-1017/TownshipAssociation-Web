"use client";

import { memo } from "react";
import { Button, Dropdown, Space } from "tdesign-react";
import { ChevronDownIcon, UserCircleIcon } from "tdesign-icons-react";
import style from "./header-icon.module.css";

const { DropdownMenu, DropdownItem } = Dropdown;

interface IProps {
  username: string;
  onLogout: () => void;
}

/**
 * 顶栏右侧图标组(模板 HeaderIcon)：仅保留用户下拉(退出登录)。
 * 消息角标 / 源码仓库 / 帮助文档三个入口为模板演示项(指向 TDesign)，已按需求移除，
 * 原版保留在 src/tdesign-starter/。
 */
const HeaderIcon = memo(function HeaderIcon({ username, onLogout }: IProps) {
  return (
    <Space align="center">
      <Dropdown trigger="click">
        <Button variant="text" className={style.dropdown}>
          <UserCircleIcon className={style.icon} />
          <span>{username}</span>
          <ChevronDownIcon className={style.icon} />
        </Button>
        <DropdownMenu>
          <DropdownItem onClick={onLogout}>
            <div className={style.dropItem}>
              <UserCircleIcon />
              <span>退出登录</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </Space>
  );
});

export default HeaderIcon;
