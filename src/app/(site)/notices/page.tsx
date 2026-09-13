"use client";

import Link from "next/link";
import { PageHead, PinnedBadge } from "@/components/site/parts";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/state-blocks";
import { useAsyncData } from "@/components/site/use-async-data";
import { fetchNotices } from "@/lib/site-api";
import { formatDate } from "@/lib/site-format";

/**
 * 公告列表：置顶优先、发布时间倒序（后端已排好，前端按原序展示）。
 */
export default function NoticesPage() {
  const { state, reload } = useAsyncData(fetchNotices);
  const list = state.data ?? [];

  return (
    <div>
      <PageHead title="公告通知" subtitle="乡会通知与公开信息，置顶公告优先展示" />

      <div className="site-container pt-6 sm:pt-8">
        {state.status === "loading" ? <ListSkeleton rows={5} /> : null}
        {state.status === "error" ? (
          <ErrorHint message={state.error} onRetry={reload} />
        ) : null}
        {state.status === "ready" && list.length === 0 ? (
          <EmptyHint text="暂无公告，请稍后再来查看。" />
        ) : null}
        {state.status === "ready" && list.length > 0 ? (
          <ul className="site-card site-divide overflow-hidden">
            {list.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notices/detail?id=${encodeURIComponent(n.id)}`}
                  className="block px-5 py-4 transition-colors hover:bg-[#faf5ea] sm:px-6 sm:py-5"
                >
                  <div className="flex items-center gap-2.5">
                    {n.pinned ? <PinnedBadge /> : null}
                    <h2 className="site-display min-w-0 flex-1 truncate text-base font-semibold sm:text-[17px]">
                      {n.title}
                    </h2>
                    <time
                      className="t-sub shrink-0 text-xs tabular-nums sm:text-sm"
                      dateTime={n.publishedAt}
                    >
                      {formatDate(n.publishedAt)}
                    </time>
                  </div>
                  {n.summary ? (
                    <p className="t-soft mt-1.5 line-clamp-2 text-sm">{n.summary}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
