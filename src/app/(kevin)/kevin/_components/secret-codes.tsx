"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** 科乐美指令：↑ ↑ ↓ ↓ ← → ← → B A */
const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];

/**
 * 键盘彩蛋（仅 /kevin 下挂载）：
 * - 依次敲 `gdut` → 浮层认亲，给个回乡会的链接；
 * - 科乐美指令 → emoji 雨。
 * 输入焦点在输入框/可编辑区时不拦截。
 */
export default function SecretCodes() {
  const [toast, setToast] = useState<string | null>(null);
  const [rain, setRain] = useState(false);
  const buf = useRef<string[]>([]);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) {
        return;
      }

      // 文字序列：gdut
      if (/^[a-zA-Z]$/.test(e.key)) {
        buf.current.push(e.key.toLowerCase());
        if (buf.current.length > 8) buf.current.shift();
        if (buf.current.join("").endsWith("gdut")) {
          buf.current = [];
          showToast("胶己人！🤝 欢迎回乡会官网坐坐");
        }
        return;
      }

      // 方向键/B/A：科乐美指令
      buf.current.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      const seq = buf.current.slice(-KONAMI.length);
      if (seq.length === KONAMI.length && seq.every((k, i) => k === KONAMI[i])) {
        buf.current = [];
        setRain(true);
        window.setTimeout(() => setRain(false), 4000);
      }
      if (buf.current.length > 24) buf.current.shift();
    };

    const showToast = (msg: string) => {
      setToast(msg);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 3600);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <>
      {toast && (
        <div className="kevin-toast kevin-mono rounded-full border border-[var(--kv-accent)] bg-[var(--kv-bg-2)] px-5 py-2.5 text-sm shadow-xl">
          {toast}
          <Link href="/" className="ml-2 underline underline-offset-4 text-[var(--kv-accent)]">
            去官网
          </Link>
        </div>
      )}
      {rain && (
        <div className="kevin-rain" aria-hidden>
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 137) % 100}%`,
                animationDuration: `${2 + ((i * 53) % 90) / 100}s`,
                animationDelay: `${((i * 31) % 80) / 100}s`,
              }}
            >
              {["🎮", "💣", "🔥", "✨", "🐧"][i % 5]}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
