"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncStatus = "loading" | "ready" | "error";

export interface AsyncData<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

const INITIAL: AsyncData<never> = { status: "loading", data: null, error: null };

/** 一次成功/失败取数的结果，连同它所属的 (key, tick) 标签一起存 */
interface Settled<T> {
  key: unknown;
  tick: number;
  state: AsyncData<T>;
}

/**
 * 官网只读取数状态机：loading → ready / error。
 *
 * - loader 只取最近一次引用（渲染期间的函数身份变化不会触发重新请求）；
 * - key 变化（如公告 id 变化）自动重新取数；
 * - 失败后通过 reload() 显式重试，页面据此给「稍后重试」出口，不白屏；
 * - loading 态由「已落库结果与当前 (key,tick) 不匹配」在渲染期派生，
 *   不在 effect 体内同步 setState（避免级联渲染），loader 引用也只在 effect 里回写。
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  key: unknown = null,
): { state: AsyncData<T>; reload: () => void } {
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  // 每次渲染后刷新引用；effect 按声明顺序执行，本 effect 先于取数 effect
  useEffect(() => {
    loaderRef.current = loader;
  });

  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loaderRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ key, tick, state: { status: "ready", data, error: null } });
      },
      (err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : "数据加载失败，请稍后重试";
        setSettled({ key, tick, state: { status: "error", data: null, error: message } });
      },
    );
    return () => {
      cancelled = true;
    };
    // loader 身份故意不进依赖：见文件头说明
  }, [key, tick]);

  const state =
    settled && Object.is(settled.key, key) && settled.tick === tick
      ? settled.state
      : INITIAL;

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { state, reload };
}
