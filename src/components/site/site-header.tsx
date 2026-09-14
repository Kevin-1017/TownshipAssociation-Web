"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

  // 移动菜单在「导航动作发生时」收起（事件驱动），不用 effect 监听 pathname

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="site-container flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="广工胶己人 首页"
          onClick={() => setOpen(false)}
        >
          <span className="site-seal site-display" aria-hidden>
            胶
          </span>
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

      {/* 窄屏导航面板 */}
      {open ? (
        <nav
          id="site-nav-panel"
          aria-label="主导航"
          className="border-t md:hidden"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--card)" }}
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
