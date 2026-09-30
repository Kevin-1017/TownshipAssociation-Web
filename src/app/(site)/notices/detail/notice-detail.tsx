"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyHint, ErrorHint } from "@/components/site/shared/state-blocks";
import { useAsyncData } from "@/components/site/shared/use-async-data";
import { fetchNoticeDetail } from "@/lib/site-api";
import { formatDateTime } from "@/lib/site-format";

/**
 * 公告详情：id 来自查询参数（静态导出无 SSR 取数，只能在 client 侧按 id 拉）。
 * useSearchParams 由上层 page.tsx 的 Suspense 包裹。
 */
export default function NoticeDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { state, reload } = useAsyncData(
    async () => {
      if (!id) throw new Error("缺少公告编号（URL 未带 id）");
      return fetchNoticeDetail(id);
    },
    id ?? "",
  );

  if (!id) {
    return (
      <ErrorHint
        message="链接不完整：地址中缺少公告编号"
        onRetry={() => {
          router.push("/notices");
        }}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <article className="site-card p-6 sm:p-9">
        <div role="status" aria-label="加载中" className="space-y-4">
          <span className="site-skeleton h-7 w-3/4" />
          <span className="site-skeleton block h-3.5 w-1/3" />
          <span className="site-skeleton block h-3.5 w-full" />
          <span className="site-skeleton block h-3.5 w-full" />
          <span className="site-skeleton block h-3.5 w-2/3" />
        </div>
      </article>
    );
  }

  if (state.status === "error") {
    return <ErrorHint message={state.error} onRetry={reload} />;
  }

  const notice = state.data!;
  // 正文为纯文本含换行：按空行切段，段内换行用 pre-line 保留
  const paragraphs = notice.content.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <article>
      <div className="mb-4">
        <Link href="/notices" className="t-brand text-sm underline-offset-4 hover:underline">
          ← 返回公告列表
        </Link>
      </div>

      <div className="site-card p-6 sm:p-9">
        {notice.pinned ? (
          <span className="site-chip site-chip--pinned mb-3">置顶</span>
        ) : null}
        <h1 className="site-display text-xl font-bold leading-snug sm:text-[26px] sm:leading-snug">
          {notice.title}
        </h1>
        <p className="t-sub mt-2 text-xs tabular-nums sm:text-sm">
          发布时间 · {formatDateTime(notice.publishedAt)}
        </p>

        {notice.summary ? (
          <p
            className="t-soft mt-5 border-l-[3px] py-1 pl-4 text-sm italic"
            style={{ borderColor: "var(--brand-soft)" }}
          >
            {notice.summary}
          </p>
        ) : null}

        <div className="mt-6">
          {paragraphs.length === 0 ? (
            <EmptyHint text="该公告暂无正文内容。" />
          ) : (
            <div className="space-y-4 text-[15px] leading-[1.9] sm:text-base sm:leading-[2]">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <PageHeadInline />
      </div>
    </article>
  );
}

/** 详情底部的软引导（不用 PageHead 色带，避免与页头重复视觉） */
function PageHeadInline() {
  return (
    <p className="t-sub text-center text-xs sm:text-sm">
      信息以广东工业大学潮阳潮南校友会乡会后台发布为准 ·
      <Link href="/about" className="t-brand mx-1 underline-offset-4 hover:underline">
        了解我们
      </Link>
      <Link href="/notices" className="t-brand underline-offset-4 hover:underline">
        全部公告
      </Link>
    </p>
  );
}
