"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import style from "./menu.module.css";

/** 侧栏 logo(模板 MenuLogo)：折叠时只留乡会徽章(public/logo.png)；展开时徽章 + 本站品牌文字 */
export default function MenuLogo({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();

  return (
    <div className={style.menuLogo} onClick={() => router.push("/admin")}>
      {collapsed ? (
        <Image src="/logo.png" alt="" aria-hidden width={28} height={28} className={style.menuMiniLogo} />
      ) : (
        <div className={style.logoBox}>
          <Image src="/logo.png" alt="" aria-hidden width={28} height={28} className={style.menuMiniLogo} />
          <span className={style.logoWordmark}>广工胶己人 · 校友会</span>
        </div>
      )}
    </div>
  );
}
