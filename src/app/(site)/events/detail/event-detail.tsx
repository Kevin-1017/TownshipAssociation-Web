"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorHint } from "@/components/site/state-blocks";
import { useAsyncData } from "@/components/site/use-async-data";
import { buildFileUrl } from "@/lib/api";
import { fetchEventDetail } from "@/lib/site-api";
import { formatDateTime } from "@/lib/site-format";

/**
 * 事件详情 —— 对齐小程序 event/detail.vue 的 D2 定案形态：
 * 封面 + 标题 + 时间 + 摘要卡 +「阅读公众号全文」（正文在公众号，接口无 content）。
 * 旧版报名/电话按钮随功能删除，线上契约本就没有那些字段，web 端不造幻影 UI。
 * articleUrl 为 null 时按钮置灰 +「正文整理中，敬请期待」（小程序同款口径）。
 */
export default function EventDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { state, reload } = useAsyncData(
    async () => {
      if (!id) throw new Error("缺少事件编号（URL 未带 id）");
      return fetchEventDetail(id);
    },
    id ?? "",
  );

  if (!id) {
    return (
      <ErrorHint
        message="链接不完整：地址中缺少事件编号"
        onRetry={() => {
          router.push("/events");
        }}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <article className="site-card p-6 sm:p-9" aria-busy="true">
        <div role="status" aria-label="加载中" className="space-y-4">
          <span className="site-skeleton block h-40 w-full" />
          <span className="site-skeleton h-7 w-3/4" />
          <span className="site-skeleton block h-3.5 w-1/3" />
          <span className="site-skeleton block h-3.5 w-full" />
          <span className="site-skeleton block h-3.5 w-2/3" />
        </div>
      </article>
    );
  }

  if (state.status === "error") {
    return <ErrorHint message={state.error} onRetry={reload} />;
  }

  const event = state.data!;
  const cover = buildFileUrl(event.cover);

  return (
    <article>
      <div className="mb-4">
        <Link href="/events" className="t-brand text-sm underline-offset-4 hover:underline">
          ← 返回乡会事件
        </Link>
      </div>

      <div className="site-card overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-44 w-full object-cover sm:h-56" />
        ) : (
          <div
            className="site-display flex h-44 w-full items-center justify-center text-5xl font-bold text-white sm:h-56"
            style={{
              background: "linear-gradient(160deg, var(--brand) 0%, var(--brand-bright) 100%)",
            }}
            aria-hidden
          >
            {event.title.slice(0, 1)}
          </div>
        )}

        <div className="p-6 sm:p-9">
          <h1 className="site-display text-xl font-bold leading-snug sm:text-[26px] sm:leading-snug">
            {event.title}
          </h1>
          <time className="t-sub mt-2 block text-sm tabular-nums" dateTime={event.startTime}>
            {formatDateTime(event.startTime)}
          </time>

          {event.summary ? (
            <p className="t-soft mt-5 whitespace-pre-line text-[15px] leading-[1.9] sm:text-base sm:leading-[2]">
              {event.summary}
            </p>
          ) : null}

          <div className="mt-7">
            {event.articleUrl ? (
              <a
                href={event.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="site-btn site-btn--primary"
              >
                阅读公众号全文 ↗
              </a>
            ) : (
              <>
                <button
                  type="button"
                  className="site-btn site-btn--ghost"
                  style={{ opacity: 0.55, cursor: "not-allowed" }}
                  disabled
                >
                  阅读公众号全文
                </button>
                <p className="t-sub mt-2 text-xs">正文整理中，敬请期待</p>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="t-sub mt-6 text-center text-xs sm:text-sm">
        事件信息由乡会秘书处发布 ·
        <Link href="/events" className="t-brand mx-1 underline-offset-4 hover:underline">
          查看更多事件
        </Link>
      </p>
    </article>
  );
}
