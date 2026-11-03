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

/** 顶栏右侧图标组：用户下拉(退出登录) */
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
              <span>退出登录</span>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </Space>
  );
});

export default HeaderIcon;
