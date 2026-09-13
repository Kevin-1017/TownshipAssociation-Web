import Link from "next/link";
import { formatAmount } from "@/lib/site-format";

/**
 * 官网共用展示零件：金额、徽标、区头、子页页头。
 * 金额口径：单位「元」；捐赠 amount 为 null 表示保密（调用方渲染「鸣谢」徽标，不显示数字）。
 */

/** 金额文字（暖褐色）；null / 0 / 缺省时不渲染（获奖记录奖金可缺省） */
export function AmountText({ amount }: { amount: number | null | undefined }) {
  if (amount == null || amount === 0) return null;
  return <span className="site-amount text-base sm:text-lg">{formatAmount(amount)}</span>;
}

/** 捐赠金额保密时的「鸣谢」徽标 */
export function ThanksBadge() {
  return <span className="site-chip site-chip--thanks">鸣谢</span>;
}

/** 公告置顶徽标 */
export function PinnedBadge() {
  return <span className="site-chip site-chip--pinned">置顶</span>;
}

/** 首页/列表页区头：左标题（可带副题），右侧「更多」链接 */
export function SectionHead({
  id,
  title,
  subtitle,
  moreHref,
  moreLabel = "更多",
}: {
  id?: string;
  title: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="site-display text-xl font-bold sm:text-2xl">
          {title}
        </h2>
        {subtitle ? <p className="t-sub mt-0.5 text-xs sm:text-sm">{subtitle}</p> : null}
      </div>
      {moreHref ? (
        <Link
          href={moreHref}
          className="t-brand shrink-0 pb-0.5 text-sm underline-offset-4 hover:underline"
        >
          {moreLabel} →
        </Link>
      ) : null}
    </div>
  );
}

/** 子页页头色带：标题 + 副题 */
export function PageHead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="site-pagehead">
      <div className="site-container py-9 sm:py-12">
        <p className="text-[11px] font-medium tracking-[0.3em] opacity-70">
          广工胶己人 · 广东工业大学潮阳潮南校友会
        </p>
        <h1 className="site-display mt-2 text-2xl font-bold sm:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm opacity-85">{subtitle}</p> : null}
      </div>
    </div>
  );
}
