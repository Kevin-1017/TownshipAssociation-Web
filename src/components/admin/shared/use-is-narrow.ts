"use client";

import { useSyncExternalStore } from "react";

/** 手机档断点：比侧栏自动折叠（900px）更窄才算「窄屏」，与列裁剪口径一致 */
const NARROW_MQ = "(max-width: 760px)";

function subscribe(onStoreChange: () => void): () => void {
  const mq = window.matchMedia(NARROW_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

const getSnapshot = (): boolean => window.matchMedia(NARROW_MQ).matches;

/** 构建期/SSR 首帧无 window：按宽屏渲染，水合后由真实值纠正（与 AdminShell token 同套路） */
const getServerSnapshot = (): boolean => false;

/**
 * 窄视口判定（matchMedia 外部 store）：供管理页在手机上裁剪表格列、堆叠工具栏。
 * 内容区已放开 760px 最小宽度（app-layout.module.css），页面级响应式在此之上叠加。
 */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
