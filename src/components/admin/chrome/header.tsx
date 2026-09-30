"use client";

import { memo } from "react";
import { Button, Layout, Space } from "tdesign-react";
import { ViewListIcon } from "tdesign-icons-react";
import HeaderIcon from "./header-icon";
import { useAdminUI } from "../shared/ui-state";
import style from "./header.module.css";

const { Header: THeader } = Layout;

interface IProps {
  username: string;
  onLogout: () => void;
}

/** 顶栏（侧边布局形态）：折叠按钮 + 右侧图标组 */
const AdminHeader = memo(function AdminHeader({ username, onLogout }: IProps) {
  const { toggleMenu } = useAdminUI();

  return (
    <THeader className={style.panel}>
      <Space align="center">
        <Button
          shape="square"
          size="large"
          variant="text"
          onClick={() => toggleMenu(null)}
          icon={<ViewListIcon />}
        />
      </Space>
      <HeaderIcon username={username} onLogout={onLogout} />
    </THeader>
  );
});

export default AdminHeader;
