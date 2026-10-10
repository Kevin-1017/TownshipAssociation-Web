"use client";

import { useRef, type ReactNode } from "react";

/**
 * 鼠标倾斜卡片：靠近哪角就往哪角微仰（最大 6°），离开回弹。
 * transform 直接写 style，不走 state，避免高频重渲染。
 */
export default function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 ~ 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(4px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`kevin-tilt rounded-2xl border border-[var(--kv-line)] bg-[var(--kv-bg-2)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
