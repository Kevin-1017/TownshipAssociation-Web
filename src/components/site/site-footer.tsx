import Link from "next/link";

/**
 * 官网页脚：组织口径 + 联系邮箱 + 法务链接。全站共用，由 (site)/layout 渲染。
 */

const SITE_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "首页" },
  { href: "/foundation", label: "校友基金会" },
  { href: "/notices", label: "公告通知" },
  { href: "/about", label: "关于我们" },
];

const LEGAL_LINKS: { href: string; label: string }[] = [
  { href: "/legal/privacy", label: "隐私保护指引" },
  { href: "/legal/agreement", label: "用户服务协议" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer mt-16">
      <div className="site-container py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="site-seal site-display" aria-hidden>
                胶
              </span>
              <div className="leading-tight">
                <p className="site-display text-base font-bold">广工胶己人</p>
                <p className="t-footer-sub text-xs">广东工业大学潮阳潮南校友会</p>
              </div>
            </div>
            <p className="t-footer-body mt-4 text-sm">
              校友会信息展示平台，非经营性；公告通知、奖励表彰与捐赠鸣谢等公开数据由乡会秘书处整理公布。
            </p>
            <p className="t-footer-body mt-2 text-sm">
              联系邮箱：
              <a href="mailto:13623034184@163.com" className="underline underline-offset-4">
                13623034184@163.com
              </a>
            </p>
          </div>

          <nav aria-label="页脚导航" className="flex gap-10 sm:gap-14">
            <div>
              <p className="site-footer-heading text-sm font-semibold">站内导航</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {SITE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="underline-offset-4 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="site-footer-heading text-sm font-semibold">法律与合规</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="underline-offset-4 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="site-footer-divider mt-9 pt-5 text-xs t-footer-sub">
          © 2026 广东工业大学潮阳潮南校友会（广工胶己人）· 同是一方水土人，相逢异方倍亲切
        </div>
      </div>
    </footer>
  );
}
