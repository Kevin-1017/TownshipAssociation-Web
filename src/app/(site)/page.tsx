"use client";

import Link from "next/link";
import Image from "next/image";
import LeaderShowcaseSection from "@/components/site/leader-showcase";
import Reveal from "@/components/site/reveal";
import RevealGroup from "@/components/site/reveal-group";
import { AmountText, SectionHead, ThanksBadge } from "@/components/site/parts";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/state-blocks";
import { useAsyncData } from "@/components/site/use-async-data";
import { buildFileUrl } from "@/lib/api";
import { fetchEvents, fetchFoundationHome } from "@/lib/site-api";
import { formatDate } from "@/lib/site-format";

/**
 * 官网首页：hero + 乡会事件速览 + 基金会（奖励 / 捐赠鸣谢）预览 + 负责人风采。
 * 只读取数在客户端完成，两路数据各自兜底，单路失败不拖垮整页。
 */
export default function SiteHomePage() {
  const foundation = useAsyncData(fetchFoundationHome);

  const rewardItems = (foundation.state.data?.rewards ?? []).slice(0, 4);
  const donationItems = (foundation.state.data?.donations ?? []).slice(0, 4);
  // 乡会事件最新两条：后端 start_time 倒序，口径同小程序首页区（pageSize 2 即所求）
  const events = useAsyncData(() => fetchEvents({ page: 1, pageSize: 2 }));
  const eventRows = events.state.data?.list ?? [];

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="site-hero" aria-label="网站简介">
        {/* 首屏 LCP 背景照（public/home-hero.jpg 2848x1600，域名固定 /public，不走 buildFileUrl；
            unoptimized 下 Image 即直出 img，显式 eager 防 Image 默认 lazy 拖 LCP）；纱层保白字对比度 */}
        <Image src="/home-hero.jpg" alt="" aria-hidden width={2848} height={1600} loading="eager" fetchPriority="high" className="site-hero__bg" />
        <span className="site-hero__scrim" aria-hidden />
        <div className="site-container relative z-10 py-12 sm:py-16">
          {/* 首屏逐行入场：进视口即触发（页顶时立即播），一行慢于一行 */}
          <RevealGroup step={70}>
            <p className="text-xs tracking-[0.3em] opacity-80">乡情 · 联谊 · 奖教助学</p>
            <h1 className="site-display mt-3 text-3xl font-bold leading-snug sm:text-5xl">
              广工胶己人
            </h1>
            <p className="mt-2 text-base font-medium opacity-95 sm:text-lg">
              广东工业大学潮阳潮南校友会
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed opacity-85 sm:text-[15px]">
              乡会事件、奖励表彰、捐赠鸣谢 —— 乡会公开信息，一站查看。
            </p>
            <p className="site-display mt-2 text-sm opacity-70">同是一方水土人，相逢异方倍亲切。</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/events" className="site-btn site-btn--onblue">
                看乡会事件
              </Link>
              <Link href="/foundation" className="site-btn site-btn--onblue">
                校友基金会
              </Link>
            </div>
          </RevealGroup>
        </div>
      </section>

      <div className="site-container space-y-12 pt-10 sm:pt-12">
        {/* ---------- 乡会事件速览（对应小程序首页「乡会事件」区：最新两条，左图右文；
            公告职能已被事件线顶替，原「最新公告」区按用户决策移除） ---------- */}
        <section aria-labelledby="home-events-title">
          <Reveal>
            <SectionHead
              id="home-events-title"
              title="乡会事件"
              subtitle="乡会大事与活动，按年份回顾"
              moreHref="/events"
              moreLabel="全部事件"
            />
          </Reveal>
          {events.state.status === "loading" ? <ListSkeleton rows={2} /> : null}
          {events.state.status === "error" ? (
            <ErrorHint message={events.state.error} onRetry={events.reload} />
          ) : null}
          {events.state.status === "ready" && eventRows.length === 0 ? (
            <EmptyHint text="暂无事件，敬请期待。" />
          ) : null}
          {events.state.status === "ready" && eventRows.length > 0 ? (
            <div className="site-card site-divide overflow-hidden">
              {eventRows.map((e) => {
                const cover = buildFileUrl(e.cover);
                // 详情页已删：有 articleUrl 直接新窗口跳公众号，无链接的行不具跳转语义（旧后端键可能缺失）
                const articleUrl = e.articleUrl ?? null;
                const inner = (
                  <>
                    {cover ? (
                      // 封面域名不定（/tsa/files 相对址或外链），不进 next/image 白名单，用原生 img 懒加载
                      <img
                        src={cover}
                        alt=""
                        loading="lazy"
                        className="site-event-cover site-event-cover--row"
                      />
                    ) : (
                      <span
                        className="site-event-cover site-event-cover--row site-event-cover--empty site-display"
                        aria-hidden
                      >
                        {e.title.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="site-display line-clamp-2 text-[15px] font-semibold">
                        {e.title}
                      </h3>
                      <p className="t-sub mt-1 text-xs tabular-nums">
                        {formatDate(e.startTime)}
                        {articleUrl ? null : " · 公众号链接整理中"}
                      </p>
                    </div>
                    {articleUrl ? (
                      <span aria-hidden className="t-soft shrink-0 text-lg leading-none">
                        ↗
                      </span>
                    ) : null}
                  </>
                );
                return articleUrl ? (
                  <Reveal key={e.id}>
                    <a
                      href={articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#faf5ea] sm:px-6"
                    >
                      {inner}
                    </a>
                  </Reveal>
                ) : (
                  <Reveal key={e.id}>
                    <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#faf5ea] sm:px-6">
                      {inner}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* ---------- 校友基金会速览 ---------- */}
        <section aria-labelledby="home-foundation-title">
          <Reveal>
            <SectionHead
              id="home-foundation-title"
              title="校友基金会"
              subtitle="奖励与表彰 · 捐赠鸣谢，公开可查"
              moreHref="/foundation"
              moreLabel="查看明细"
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            {/* 校内奖励与表彰 */}
            <Reveal>
              <div className="site-card flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                  <h3 className="site-display font-bold">校内奖励与表彰</h3>
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
            </Reveal>

            {/* 捐赠与帮助致谢 */}
            <Reveal>
              <div className="site-card flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                  <h3 className="site-display font-bold">捐赠与帮助致谢</h3>
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
                            <p className="t-sub mt-0.5 text-xs tabular-nums">
                              {formatDate(d.date)}
                            </p>
                          </div>
                          {d.amount == null ? <ThanksBadge /> : <AmountText amount={d.amount} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- 负责人风采 ---------- */}
        <Reveal delay={80}>
          <LeaderShowcaseSection />
        </Reveal>
      </div>
    </div>
  );
}
