import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import SecretCodes from "./_components/secret-codes";
import "./kevin.css";

/**
 * Kevin 个人主页壳 —— 与 (site)/(admin) 平级的独立路由组：
 * 深色极客风，不带校友会导航头尾，样式全部收在 .kevin-root 作用域内。
 */
export const metadata: Metadata = {
  title: {
    default: "Kevin · 个人主页",
    template: "%s · Kevin",
  },
  description: "Kevin 的个人主页：项目、技术栈与 CS:GO 道具指南。",
  // 个人页挂在乡会域名下，默认不进搜索引擎；想被搜到就把下面两行删掉
  robots: { index: false, follow: false },
};

export default function KevinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kevin-root relative min-h-dvh">
      <div className="kevin-aurora" aria-hidden />
      {/* 左上角低调的回乡会官网入口 */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 pt-5 sm:px-8">
        <span className="kevin-mono text-sm text-[var(--kv-soft)]">
          kevin@gdut:~$
        </span>
        <Link
          href="/"
          className="kevin-mono rounded-full border border-[var(--kv-line)] px-3 py-1 text-xs text-[var(--kv-soft)] transition-colors hover:border-[var(--kv-accent)] hover:text-[var(--kv-accent)]"
        >
          ← 回乡会官网
        </Link>
      </header>
      <main className="relative z-10">{children}</main>
      {/* 键盘彩蛋：输 gdut / 科乐美指令 */}
      <SecretCodes />
      <footer className="kevin-mono relative z-10 mx-auto max-w-5xl px-5 py-10 text-xs text-[var(--kv-soft)] sm:px-8">
        © {new Date().getFullYear()} Kevin · 本站与「广工胶己人」乡会官网无关，纯属个人自留地
      </footer>
    </div>
  );
}
