import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/site/shared/reveal";
import RevealGroup from "@/components/site/shared/reveal-group";
import "./site-footer.css";

/**
 * 官网页脚：组织口径 + 联系邮箱 + 法务链接。全站共用，由 (site)/layout 渲染。
 */

const SITE_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "首页" },
  { href: "/foundation", label: "校友基金会" },
  { href: "/events", label: "乡会事件" },
  { href: "/community", label: "社区广场" },
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
          <Reveal className="max-w-sm">
            <div className="flex items-center gap-2.5">
              {/* 乡会 logo 徽章（与页头同款图；footer 深底上白色圆盘自带对比） */}
              <Image src="/logo.png" alt="" aria-hidden width={36} height={36} className="site-seal-img" />
              <div className="leading-tight">
                <p className="site-display text-base font-bold">广工胶己人</p>
                <p className="t-footer-sub text-xs">广东工业大学潮阳潮南校友会</p>
              </div>
            </div>
            <p className="t-footer-body mt-4 text-sm">
             本网站由Kevin独立开发完成。
            </p>
            <p className="t-footer-body mt-2 text-sm">
              联系邮箱：
              <a href="mailto:13623034184@163.com" className="underline underline-offset-4">
                13623034184@163.com
              </a>
            </p>
          </Reveal>

          <nav aria-label="页脚导航" className="flex gap-10 sm:gap-14">
            <RevealGroup step={70}>
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
            </RevealGroup>
          </nav>
        </div>

        <Reveal delay={160}>
          <div className="site-footer-divider mt-9 pt-5 text-xs t-footer-sub">
            <p>© 2026 广东工业大学潮阳潮南校友会（广工胶己人）· 同是一方水土人，相逢异方倍亲切</p>
            {/* ICP 占位：与小程序 constants/icp.ts 同口径，备案号下发后两处一起替换 */}
            <p className="mt-1">
              网站备案号：
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-white"
              >
                核准中（占位）
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
