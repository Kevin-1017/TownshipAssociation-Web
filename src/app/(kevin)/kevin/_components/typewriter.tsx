"use client";

import { useEffect, useState } from "react";

/**
 * 打字机开场：按当前时刻生成问候再逐字打出。
 * 只在 useEffect 里取时间，避免服务端/客户端渲染不一致（hydration）。
 */
export default function Typewriter() {
  const [text, setText] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    const hi =
      h < 6 ? "还没睡？" : h < 11 ? "早上好" : h < 14 ? "中午好" : h < 19 ? "下午好" : "晚上好";
    const full = `${hi}，我是 Kevin ▌`;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, []);

  // 打完后把光标换成常驻闪烁的块
  const caretIdx = text.indexOf("▌");
  const shown = caretIdx >= 0 ? text.slice(0, caretIdx) : text;

  return (
    <>
      {shown}
      <span className="kevin-caret" aria-hidden>
        ▌
      </span>
    </>
  );
}
