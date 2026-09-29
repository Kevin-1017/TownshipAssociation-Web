"use client";

import { useEffect, useState } from "react";
import { Select } from "tdesign-react";
import { PageHead } from "@/components/site/parts";
import Reveal from "@/components/site/reveal";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/state-blocks";
import { EVENT_YEARS, fetchEvents } from "@/lib/site-api";
import { buildFileUrl } from "@/lib/api";
import { formatDateTime } from "@/lib/site-format";
import type { EventListItem } from "@/lib/types";
import "tdesign-react/es/style/index.css";
import "tdesign-react/es/select/style/css.js";

/**
 * 乡会事件列表：对应小程序 event/list.vue（吸顶「全部」+ 年份选择、左图右文卡片、
 * 「失败不能长得像没有」的三态口径）。差异是刻意的：小程序全量拉取后客户端做
 * 年份「区间」过滤；web 直接用后端 yearFrom/yearTo 区间过滤 + 分页加载更多，
 * 数据量再大也不拖首屏。排序由后端 start_time 倒序保证（口径与小程序一致）。
 * 2026-09-14：详情页删除（正文本在公众号、iframe 又嵌不了），卡片直跳 articleUrl。
 */

const PAGE_SIZE = 20;

/** 年份下拉选项（TDesign Select 口径）：leader-showcase 已开官网用 TDesign 的先例 */
const YEAR_OPTIONS = EVENT_YEARS.map((y) => ({ value: y, label: `${y} 年` }));

interface SettledPage {
  key: string;
  list: EventListItem[];
  total: number;
  page: number;
}

/** 卡片主体：有 articleUrl 渲染成外链 <a>（新窗口跳公众号），无链接渲染成不可点 div + 提示 */
function EventCard({ event }: { event: EventListItem }) {
  // 旧后端未下发 articleUrl 键（undefined）与「未补链接」（null）同样按无链接处理
  const articleUrl = event.articleUrl ?? null;
  const cover = buildFileUrl(event.cover);

  const body = (
    <>
      {cover ? (
        <img src={cover} alt="" loading="lazy" className="site-event-cover" />
      ) : (
        <span className="site-event-cover site-event-cover--empty site-display" aria-hidden>
          {event.title.slice(0, 1)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <h3 className="site-display line-clamp-2 text-[15px] font-bold sm:text-base">
          {event.title}
          {articleUrl ? (
            <span aria-hidden className="t-sub ml-1.5 text-xs font-normal">
              ↗
            </span>
          ) : null}
        </h3>
        {articleUrl ? (
          <time className="t-sub block text-xs tabular-nums" dateTime={event.startTime}>
            {formatDateTime(event.startTime)}
          </time>
        ) : (
          <span className="t-sub block text-xs">
            {formatDateTime(event.startTime)} · 公众号链接整理中
          </span>
        )}
      </div>
    </>
  );

  // 与首页乡会事件行完全同款：transition-colors + hover:bg-[#faf5ea]，所有卡片一律变色；
  // 唯一差别是 .site-card 挂在本卡片身上（首页行没挂），其层外裸规则会压制工具类，故加 ! 后缀
  const cardCls =
    "site-card flex gap-3.5 px-4 py-4 sm:px-5 transition-colors hover:bg-[#faf5ea]!";

  return articleUrl ? (
    <a href={articleUrl} target="_blank" rel="noopener noreferrer" className={cardCls}>
      {body}
    </a>
  ) : (
    <div className={cardCls}>{body}</div>
  );
}

export default function EventsBoard() {
  // 年份区间（含端点），两侧独立可缺省=开区间；「全部」= 两侧都为 null
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);

  const [settled, setSettled] = useState<SettledPage | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const reload = () => setRetryTick((t) => t + 1);

  const condKey = JSON.stringify([yearFrom, yearTo]);

  // 改一侧时把另一侧拉回合法区间（后端对 yearFrom>yearTo 判 400，别把非法组合发出去）
  const pickFrom = (v: number | null) => {
    setYearFrom(v);
    if (v !== null && yearTo !== null && v > yearTo) setYearTo(v);
  };
  const pickTo = (v: number | null) => {
    setYearTo(v);
    if (v !== null && yearFrom !== null && v < yearFrom) setYearFrom(v);
  };

  // loading 由「已落库结果的 key 与当前条件不符」派生（useAsyncData 同款口径）
  useEffect(() => {
    let cancelled = false;
    const [from, to] = JSON.parse(condKey) as [number | null, number | null];
    fetchEvents({ page: 1, pageSize: PAGE_SIZE, yearFrom: from, yearTo: to })
      .then((d) => {
        if (!cancelled) setSettled({ key: condKey, list: d.list, total: d.total, page: 1 });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setFailed({
            key: condKey,
            message: e instanceof Error && e.message ? e.message : "事件加载失败",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [condKey, retryTick]);

  const current = settled && settled.key === condKey ? settled : null;
  const currentError = failed && failed.key === condKey && !current ? failed.message : null;
  const status = current ? "ready" : currentError ? "error" : "loading";
  const events = current?.list ?? [];
  const total = current?.total ?? 0;
  const hasMore = events.length < total;

  const loadMore = async () => {
    if (!current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const [from, to] = JSON.parse(condKey) as [number | null, number | null];
    try {
      const d = await fetchEvents({
        page: current.page + 1,
        pageSize: PAGE_SIZE,
        yearFrom: from,
        yearTo: to,
      });
      // 回包时条件可能已切换：key 不匹配就丢弃，不污染新列表
      setSettled((prev) =>
        prev && prev.key === condKey
          ? { key: condKey, list: [...prev.list, ...d.list], total: d.total, page: prev.page + 1 }
          : prev,
      );
    } catch {
      // 加载更多失败不打断已有列表，用户可再点一次
    } finally {
      setLoadingMore(false);
    }
  };

  const selectStyle = { width: "7.5rem", flexShrink: 0 } as const;

  return (
    <div>
      <PageHead title="乡会事件" subtitle="乡会大事与活动，按年份回顾" />

      <div className="site-container pt-6 sm:pt-8">
        {/* 年份区间筛选：后端 yearFrom/yearTo 含端点；「全部」= 不带区间参数。
            下拉用 TDesign Select（clearable 回退 null），样式随官网品牌蓝 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`site-filterchip${yearFrom === null && yearTo === null ? " site-filterchip--on" : ""}`}
            onClick={() => {
              setYearFrom(null);
              setYearTo(null);
            }}
          >
            全部
          </button>
          <Select
            aria-label="起始年份"
            className="site-select-pill"
            placeholder="起始年"
            clearable
            style={selectStyle}
            value={yearFrom ?? undefined}
            options={YEAR_OPTIONS}
            onChange={(v) => pickFrom(v == null || v === "" ? null : Number(v))}
          />
          <span className="t-sub shrink-0 text-xs" aria-hidden>
            —
          </span>
          <Select
            aria-label="结束年份"
            className="site-select-pill"
            placeholder="结束年"
            clearable
            style={selectStyle}
            value={yearTo ?? undefined}
            options={YEAR_OPTIONS}
            onChange={(v) => pickTo(v == null || v === "" ? null : Number(v))}
          />
          {status === "ready" ? (
            <span className="t-sub ml-auto shrink-0 text-xs tabular-nums">共 {total} 条</span>
          ) : null}
        </div>

        <div className="pt-5 sm:pt-6">
          {status === "loading" ? <ListSkeleton rows={4} /> : null}
          {status === "error" ? <ErrorHint message={currentError} onRetry={reload} /> : null}
          {status === "ready" && events.length === 0 ? (
            <EmptyHint
              text={
                yearFrom !== null || yearTo !== null
                  ? "该时间段暂无事件。"
                  : "还没有事件，敬请期待。"
              }
            />
          ) : null}
          {status === "ready" && events.length > 0 ? (
            <>
              <ul className="space-y-3.5">
                {events.map((e, i) => (
                  <li key={e.id}>
                    <Reveal delay={Math.min(i, 6) * 60}>
                      <EventCard event={e} />
                    </Reveal>
                  </li>
                ))}
              </ul>
              <div className="mt-5 text-center">
                {hasMore ? (
                  <button
                    type="button"
                    className="site-btn site-btn--ghost"
                    disabled={loadingMore}
                    onClick={loadMore}
                  >
                    {loadingMore ? "加载中…" : "加载更多"}
                  </button>
                ) : (
                  <p className="t-sub text-xs">共 {total} 条事件，已经到底了</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
