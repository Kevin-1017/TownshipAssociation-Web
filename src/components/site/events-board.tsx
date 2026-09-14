"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/site/parts";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/state-blocks";
import { EVENT_YEARS, fetchEvents } from "@/lib/site-api";
import { buildFileUrl } from "@/lib/api";
import { formatDateTime } from "@/lib/site-format";
import type { EventListItem } from "@/lib/types";

/**
 * 乡会事件列表：对应小程序 event/list.vue（吸顶「全部」+ 年份选择、左图右文卡片、
 * 「失败不能长得像没有」的三态口径）。差异是刻意的：小程序全量拉取后客户端做
 * 年份「区间」过滤；web 直接用后端 ?year= 单年份过滤 + 分页加载更多，
 * 数据量再大也不拖首屏。排序由后端 start_time 倒序保证（口径与小程序一致）。
 */

const PAGE_SIZE = 20;

interface SettledPage {
  key: string;
  list: EventListItem[];
  total: number;
  page: number;
}

export default function EventsBoard() {
  const [year, setYear] = useState<number | null>(null);

  const [settled, setSettled] = useState<SettledPage | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const reload = () => setRetryTick((t) => t + 1);

  const condKey = JSON.stringify([year]);

  // loading 由「已落库结果的 key 与当前条件不符」派生（useAsyncData 同款口径）
  useEffect(() => {
    let cancelled = false;
    const [y] = JSON.parse(condKey) as [number | null];
    fetchEvents({ page: 1, pageSize: PAGE_SIZE, year: y })
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
    const [y] = JSON.parse(condKey) as [number | null];
    try {
      const d = await fetchEvents({
        page: current.page + 1,
        pageSize: PAGE_SIZE,
        year: y,
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

  return (
    <div>
      <PageHead title="乡会事件" subtitle="乡会大事与活动，按年份回顾" />

      <div className="site-container pt-6 sm:pt-8">
        {/* 年份筛选：后端单年份参数；「全部」= 不带 year */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`site-filterchip${year === null ? " site-filterchip--on" : ""}`}
            onClick={() => setYear(null)}
          >
            全部
          </button>
          <select
            aria-label="按年份筛选"
            className="site-input shrink-0"
            style={{ width: "auto", paddingInline: "0.9rem" }}
            value={year ?? ""}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">选择年份</option>
            {EVENT_YEARS.map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </select>
          {status === "ready" ? (
            <span className="t-sub ml-auto shrink-0 text-xs tabular-nums">共 {total} 条</span>
          ) : null}
        </div>

        <div className="pt-5 sm:pt-6">
          {status === "loading" ? <ListSkeleton rows={4} /> : null}
          {status === "error" ? <ErrorHint message={currentError} onRetry={reload} /> : null}
          {status === "ready" && events.length === 0 ? (
            <EmptyHint text={year ? "该年份暂无事件。" : "还没有事件，敬请期待。"} />
          ) : null}
          {status === "ready" && events.length > 0 ? (
            <>
              <ul className="space-y-3.5">
                {events.map((e) => {
                  const cover = buildFileUrl(e.cover);
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/events/detail?id=${encodeURIComponent(e.id)}`}
                        className="site-card flex gap-3.5 px-4 py-4 transition-shadow hover:shadow-lg sm:px-5"
                      >
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" loading="lazy" className="site-event-cover" />
                        ) : (
                          <span
                            className="site-event-cover site-event-cover--empty site-display"
                            aria-hidden
                          >
                            {e.title.slice(0, 1)}
                          </span>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                          <h3 className="site-display line-clamp-2 text-[15px] font-bold sm:text-base">
                            {e.title}
                          </h3>
                          <time
                            className="t-sub block text-xs tabular-nums"
                            dateTime={e.startTime}
                          >
                            {formatDateTime(e.startTime)}
                          </time>
                        </div>
                      </Link>
                    </li>
                  );
                })}
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
