"use client";

import { Layout, Row } from "tdesign-react";

const { Footer: TFooter } = Layout;

/** 页脚：本站版权文案，固定显示 */
export default function AdminFooter() {
  return (
    <TFooter>
      <Row justify="center">
        Copyright © 2021-{new Date().getFullYear()} 广东工业大学潮阳潮南校友会（广工胶己人）. All Rights Reserved
      </Row>
    </TFooter>
  );
}
