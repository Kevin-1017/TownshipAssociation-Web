"use client";

import Link from "next/link";
import { AmountText, PinnedBadge, SectionHead, ThanksBadge } from "@/components/site/parts";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/state-blocks";
import { useAsyncData } from "@/components/site/use-async-data";
import { fetchFoundationHome, fetchNotices } from "@/lib/site-api";
import { formatDate } from "@/lib/site-format";

/**
 * 官网首页：hero + 最新公告速览 + 基金会（奖励 / 捐赠鸣谢）预览。
 * 只读取数在客户端完成，两路数据各自兜底，单路失败不拖垮整页。
 */
export default function SiteHomePage() {
  const notices = useAsyncData(fetchNotices);
  const foundation = useAsyncData(fetchFoundationHome);

  const noticeList = (notices.state.data ?? []).slice(0, 3);
  const rewardItems = (foundation.state.data?.rewards ?? []).slice(0, 4);
  const donationItems = (foundation.state.data?.donations ?? []).slice(0, 4);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="site-hero" aria-label="网站简介">
        <div className="site-container relative z-10 py-12 sm:py-16">
          <p className="text-xs tracking-[0.3em] opacity-80">乡情 · 联谊 · 奖教助学</p>
          <h1 className="site-display mt-3 text-3xl font-bold leading-snug sm:text-5xl">
            广工胶己人
          </h1>
          <p className="mt-2 text-base font-medium opacity-95 sm:text-lg">
            广东工业大学潮阳潮南校友会
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed opacity-85 sm:text-[15px]">
            公告通知、奖励表彰、捐赠鸣谢 —— 乡会公开信息，一站查看。
          </p>
          <p className="site-display mt-2 text-sm opacity-70">同是一方水土人，相逢异方倍亲切。</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/notices" className="site-btn site-btn--onblue">
              看最新公告
            </Link>
            <Link href="/foundation" className="site-btn site-btn--onblue">
              校友基金会
            </Link>
          </div>
        </div>
      </section>

      <div className="site-container space-y-12 pt-10 sm:pt-12">
        {/* ---------- 最新公告 ---------- */}
        <section aria-labelledby="home-notices-title">
          <SectionHead
            id="home-notices-title"
            title="最新公告"
            subtitle="乡会通知与公开信息"
            moreHref="/notices"
            moreLabel="全部公告"
          />
          {notices.state.status === "loading" ? <ListSkeleton rows={3} /> : null}
          {notices.state.status === "error" ? (
            <ErrorHint message={notices.state.error} onRetry={notices.reload} />
          ) : null}
          {notices.state.status === "ready" && noticeList.length === 0 ? (
            <EmptyHint text="暂无公告，请稍后再来查看。" />
          ) : null}
          {notices.state.status === "ready" && noticeList.length > 0 ? (
            <div className="site-card site-divide overflow-hidden">
              {noticeList.map((n) => (
                <Link
                  key={n.id}
                  href={`/notices/detail?id=${encodeURIComponent(n.id)}`}
                  className="block px-5 py-4 transition-colors hover:bg-[#faf5ea] sm:px-6"
                >
                  <div className="flex items-center gap-2.5">
                    {n.pinned ? <PinnedBadge /> : null}
                    <span className="site-display min-w-0 flex-1 truncate font-semibold">
                      {n.title}
                    </span>
                    <time
                      className="t-sub shrink-0 text-xs tabular-nums sm:text-sm"
                      dateTime={n.publishedAt}
                    >
                      {formatDate(n.publishedAt)}
                    </time>
                  </div>
                  {n.summary ? (
                    <p className="t-soft mt-1 line-clamp-2 pr-2 text-sm">{n.summary}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        {/* ---------- 校友基金会速览 ---------- */}
        <section aria-labelledby="home-foundation-title">
          <SectionHead
            id="home-foundation-title"
            title="校友基金会"
            subtitle="奖励与表彰 · 捐赠鸣谢，公开可查"
            moreHref="/foundation"
            moreLabel="查看明细"
          />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {/* 校内奖励与表彰 */}
            <div className="site-card flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                <h3 className="site-display font-bold">校内奖励与表彰</h3>
                <Link href="/foundation" className="t-brand text-xs hover:underline sm:text-sm">
                  明细 →
                </Link>
              </div>
              <div className="flex-1 p-5 sm:p-6">
                {foundation.state.status === "loading" ? (
                  <div className="space-y-4" role="status" aria-label="加载中">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <span className="site-skeleton h-4 flex-1" />
                        <span className="site-skeleton h-4 w-14" />
                      </div>
                    ))}
                  </div>
                ) : foundation.state.status === "error" ? (
                  <ErrorHint message={foundation.state.error} onRetry={foundation.reload} />
                ) : rewardItems.length === 0 ? (
                  <EmptyHint text="暂无奖励信息。" />
                ) : (
                  <ul className="site-divide space-y-0">
                    {rewardItems.map((r) => (
                      <li key={r.id} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.label}</p>
                          {r.sponsor ? (
                            <p className="t-sub mt-0.5 truncate text-xs">赞助 · {r.sponsor}</p>
                          ) : null}
                        </div>
                        <AmountText amount={r.amount} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 捐赠与帮助致谢 */}
            <div className="site-card flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                <h3 className="site-display font-bold">捐赠与帮助致谢</h3>
                <Link href="/foundation" className="t-brand text-xs hover:underline sm:text-sm">
                  明细 →
                </Link>
              </div>
              <div className="flex-1 p-5 sm:p-6">
                {foundation.state.status === "loading" ? (
                  <div className="space-y-4" role="status" aria-label="加载中">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <span className="site-skeleton h-4 flex-1" />
                        <span className="site-skeleton h-4 w-14" />
                      </div>
                    ))}
                  </div>
                ) : foundation.state.status === "error" ? (
                  <ErrorHint message={foundation.state.error} onRetry={foundation.reload} />
                ) : donationItems.length === 0 ? (
                  <EmptyHint text="暂无捐赠鸣谢信息。" />
                ) : (
                  <ul className="site-divide">
                    {donationItems.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{d.donorName}</p>
                          <p className="t-sub mt-0.5 text-xs tabular-nums">{formatDate(d.date)}</p>
                        </div>
                        {d.amount == null ? <ThanksBadge /> : <AmountText amount={d.amount} />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
