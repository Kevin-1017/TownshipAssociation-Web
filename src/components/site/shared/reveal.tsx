"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 滚动进场包装器（官网与后台共用）：进入视口「渐显 + 上浮」。
 * 只要**再次进入视口**就重播动画（离屏即复位,再入再触发），
 * 故 observer 持续跟随 isIntersecting 双向切换 shown,而非「触发一次即常驻」。
 * - threshold 0.12 + rootMargin 底部 -32px：露出一点才触发,节奏更从容；
 * - delay 做同屏多卡错峰；prefers-reduced-motion 在 CSS 侧整体关闭；
 * - 无 IntersectionObserver 的老浏览器直接渲染为可见（兜底不白屏）。
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** 毫秒，transition-delay */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        // 跟随相交状态双向设定：进入视口淡入，完全离开后复位为隐藏以便重播
        for (const e of entries) setShown(e.isIntersecting);
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`site-reveal${shown ? " site-reveal--in" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
