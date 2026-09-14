"use client";

import { Layout, Row } from "tdesign-react";

const { Footer: TFooter } = Layout;

/** 页脚(模板 Footer，「显示 Footer」开关随主题配置移除后固定显示；文案换成本站版权) */
export default function AdminFooter() {
  return (
    <TFooter>
      <Row justify="center">
        Copyright © 2021-{new Date().getFullYear()} 广东工业大学潮阳潮南校友会（广工胶己人）. All Rights Reserved
      </Row>
    </TFooter>
  );
}
