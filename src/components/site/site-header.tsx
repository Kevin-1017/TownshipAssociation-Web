"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 官网顶栏：品牌印记 + 主导航。md 以上横排，窄屏折叠为菜单面板（主场景是微信内手机打开）。
 */

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "首页" },
  { href: "/foundation", label: "校友基金会" },
  { href: "/events", label: "乡会事件" },
  { href: "/community", label: "社区广场" },
  { href: "/about", label: "关于我们" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // 两态：回顶=通栏一横条（banner 在其下方）；下拉>40px=变悬浮胶囊（site.css 裸规则驱动形变）
  const [float, setFloat] = useState(false);

  // 移动菜单在「导航动作发生时」收起（事件驱动），不用 effect 监听 pathname

  useEffect(() => {
    const onScroll = () => setFloat(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${float ? " site-header--float" : ""}`}>
      <div className="site-header__bar">
        <div className="site-container flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="广工胶己人 首页"
          onClick={() => setOpen(false)}
        >
          {/* 乡会 logo 徽章（public/logo.png，源图 alpha 裁方导出）；文字回退在同行的站名里 */}
          <Image src="/logo.png" alt="" aria-hidden width={36} height={36} loading="eager" className="site-seal-img" />
          <span className="min-w-0 leading-tight">
            <span className="site-display block truncate text-base font-bold">广工胶己人</span>
            <span className="t-sub hidden truncate text-[11px] sm:block">
              广东工业大学潮阳潮南校友会
            </span>
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav aria-label="主导航" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`site-navlink${active ? " site-navlink--active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 窄屏折叠按钮 */}
        <button
          type="button"
          className="site-btn site-hamburger"
          style={{ padding: "0.375rem 0.75rem", borderColor: "var(--line)", color: "var(--ink-2)" }}
          aria-expanded={open}
          aria-controls="site-nav-panel"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <>
                <path d="M5 5l10 10" />
                <path d="M15 5L5 15" />
              </>
            ) : (
              <>
                <path d="M3.5 6h13" />
                <path d="M3.5 10h13" />
                <path d="M3.5 14h13" />
              </>
            )}
          </svg>
        </button>
        </div>
      </div>

      {/* 窄屏导航面板 */}
      {open ? (
        <nav
          id="site-nav-panel"
          aria-label="主导航"
          className="md:hidden"
        >
          <div className="site-container flex flex-col py-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`site-navlink justify-start rounded-xl px-3 py-2.5${
                    active ? " site-navlink--active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
