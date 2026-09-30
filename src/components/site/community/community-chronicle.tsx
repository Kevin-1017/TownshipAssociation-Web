import Link from "next/link";
import { PageHead } from "@/components/site/shared/parts";
import "./community-chronicle.css";

/**
 * 乡会流年志 —— 官方编年史（纵向时间线，只读）。
 * 条目为示例稿，上线前由编辑部替换为乡会真实大事记。
 */
interface Milestone {
  year: string;
  title: string;
  content: string;
}

/** 示例大事记（年份事件为虚构演示）：提审/上线前替换为乡会真实编年 */
const MILESTONES: Milestone[] = [
  { year: "2013", title: "助学金落地", content: "乡会奖学金首次发放，此后逐年扩面。" },
  { year: "2017", title: "理事会换届", content: "活动召集转向各届别校友承办。" },
  {
    year: "2023",
    title: "数字化起步",
    content: "会员名册电子化，乡会基金会账目开始按季度公开鸣谢。",
  },
  {
    year: "2026",
    title: "小程序上线",
    content: "广工潮阳潮南乡会小程序发布，公告、活动报名与奖学金公示迁入手机端。",
  },
];

export default function CommunityChronicle() {
  return (
    <div>
      <PageHead title="乡会流年志" subtitle="一届一程皆故事" />
      <div className="site-container pt-6 sm:pt-8">
        <div className="mb-1">
          <Link href="/community" className="t-brand text-sm underline-offset-4 hover:underline">
            ← 返回广场
          </Link>
        </div>

        <ol className="site-timeline mt-6">
          {MILESTONES.map((m) => (
            <li key={m.year} className="site-timeline-item">
              <h3 className="site-display text-[15px] font-bold sm:text-base">
                <span className="t-brand tabular-nums">{m.year}</span>
                {" · "}
                {m.title}
              </h3>
              <p className="t-soft mt-1 text-sm leading-relaxed">{m.content}</p>
            </li>
          ))}
        </ol>

        <p className="t-sub mt-8 text-center text-xs sm:text-sm">
          大事记由乡会编辑部编撰，如有史实出入欢迎指正
        </p>
      </div>
    </div>
  );
}
