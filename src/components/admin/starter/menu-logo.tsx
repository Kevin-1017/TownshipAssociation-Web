"use client";

import { useRouter } from "next/navigation";
import TMark from "./logo";
import style from "./menu.module.css";

/** 侧栏 logo(模板 MenuLogo)：折叠时只留 T 角标；展开时角标 + 本站品牌文字 */
export default function MenuLogo({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();

  return (
    <div className={style.menuLogo} onClick={() => router.push("/admin")}>
      {collapsed ? (
        <TMark className={style.menuMiniLogo} />
      ) : (
        <div className={style.logoBox}>
          <TMark />
          <span className={style.logoWordmark}>广工胶己人 · 校友会</span>
        </div>
      )}
    </div>
  );
}
