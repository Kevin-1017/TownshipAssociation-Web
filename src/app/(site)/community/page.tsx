import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/parts";

export const metadata: Metadata = {
  title: "社区广场",
};

/**
 * 社区广场入口页：三张并列卡片（乡会流年志 / 美食基地 / 校园资讯）。
 * 流年志是官方编年史只读专栏；美食基地、校园资讯即小程序「美食基地 + 校园广场」
 * 两板块的 web 化 —— 各自独立的动态列表,可发布/点赞/评论(网站不受微信 5.7.1 限制)。
 */
const ENTRIES: { href: string; title: string; desc: string; tag?: string }[] = [
  {
    href: "/community/chronicle",
    title: "乡会流年志",
    desc: "一届一程皆故事 · 官方编年史",
    tag: "官方",
  },
  {
    href: "/community/food",
    title: "美食基地",
    desc: "乡友美食动态 —— 发探店、晒家乡味",
    tag: "可发布",
  },
  {
    href: "/community/campus",
    title: "校园资讯",
    desc: "校园广场动态 —— 活动召集、校友闲谈",
    tag: "可发布",
  },
];

export default function CommunityPage() {
  return (
    <div>
      <PageHead title="社区广场" subtitle="官方编年与乡友动态,一站直达" />
      <div className="site-container pt-6 sm:pt-8">
        <ul className="space-y-3.5">
          {ENTRIES.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                className="site-card flex items-center gap-4 px-5 py-5 transition-shadow hover:shadow-lg sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="site-display flex items-center gap-2 text-base font-bold sm:text-lg">
                    {e.title}
                    {e.tag ? (
                      <span
                        className={`site-chip ${e.tag === "官方" ? "site-chip--pinned" : "site-chip--thanks"}`}
                      >
                        {e.tag}
                      </span>
                    ) : null}
                  </p>
                  <p className="t-sub mt-0.5 text-sm">{e.desc}</p>
                </div>
                <span aria-hidden className="t-soft shrink-0 text-xl leading-none">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="t-sub mt-6 text-xs">
          * 流年志由乡会编辑部编撰；美食与校园动态由乡友自愿发布、不代表乡会立场。
        </p>
      </div>
    </div>
  );
}
