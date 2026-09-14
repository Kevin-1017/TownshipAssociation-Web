"use client";

import { Children, type ReactNode } from "react";
import Reveal from "@/components/site/reveal";

/**
 * 逐元素错峰进场：每个直接子节点各包一个 Reveal，delay 按序号 ×step 递增。
 * 子节点必须自带稳定 key（列表渲染天然满足）；单个不想分拍的元素可用
 * <Reveal> 直接包，不走本组件。
 */
export default function RevealGroup({
  children,
  step = 70,
}: {
  children: ReactNode;
  /** 相邻子元素的延迟步进（毫秒） */
  step?: number;
}) {
  return (
    <>
      {Children.map(children, (child, i) =>
        child === null ? null : <Reveal delay={i * step}>{child}</Reveal>,
      )}
    </>
  );
}
