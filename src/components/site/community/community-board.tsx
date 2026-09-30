"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CommunityPublishDialog from "@/components/site/community/community-publish";
import { PageHead } from "@/components/site/shared/parts";
import Reveal from "@/components/site/shared/reveal";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/shared/state-blocks";
import {
  COMMUNITY_REGIONS,
  CUISINE_OPTIONS,
  fetchCommunityPosts,
  regionLabel,
} from "@/lib/site-api";
import { formatRelative } from "@/lib/site-format";
import type { CommunityPost, CommunityPostType } from "@/lib/types";

/**
 * 社区板块（美食基地 / 校园资讯）单页：由广场三卡片入口分别进入，
 * 本页只做「这一个板块」的动态流。
 * 发布/点赞/评论等写链路在 web 站保留，不受小程序合规撤写限制。
 * 后端 /tsa/community/posts 按 type 分栏，美食栏另带菜系/地区筛选与关键词搜索。
 */

const PAGE_SIZE = 10;

const SECTIONS: Record<CommunityPostType, { title: string; subtitle: string; placeholder: string }> =
  {
    food: {
      title: "美食基地",
      subtitle: "乡友美食动态 —— 发探店、晒家乡味",
      placeholder: "搜索美食动态",
    },
    campus: {
      title: "校园资讯",
      subtitle: "校园广场动态 —— 活动召集、校友闲谈",
      placeholder: "搜索校园动态",
    },
  };

type ListStatus = "loading" | "ready" | "error";

/** 已落库的一页列表数据，连同它所属的筛选条件标签（同 useAsyncData 的派生 loading 口径） */
interface SettledPage {
  key: string;
  list: CommunityPost[];
  total: number;
  page: number;
}

export default function CommunityBoard({ type }: { type: CommunityPostType }) {
  const section = SECTIONS[type];
  // keywordDraft 是输入框草稿，keyword 是已提交生效值（点搜索/回车才生效）
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  // 菜系/地区为单选筛选（后端 CommunityPostQuery 单值口径），仅美食板块展示
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  const [publishOpen, setPublishOpen] = useState(false);

  const [settled, setSettled] = useState<SettledPage | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // 失败重试 / 发布成功后重新拉第一页
  const [retryTick, setRetryTick] = useState(0);
  const reload = () => setRetryTick((t) => t + 1);

  const condKey = JSON.stringify([type, keyword, cuisine, region]);

  // 条件变化 → 重新拉第一页；loading 由「已落库结果的 key 与当前条件不符」派生，
  // 不在 effect 体内同步 setState（useAsyncData 同款口径）
  useEffect(() => {
    let cancelled = false;
    const [t, k, c, r] = JSON.parse(condKey) as [
      CommunityPostType,
      string,
      string | null,
      string | null,
    ];
    fetchCommunityPosts({ page: 1, pageSize: PAGE_SIZE, type: t, keyword: k, cuisine: c, region: r })
      .then((d) => {
        if (!cancelled) setSettled({ key: condKey, list: d.list, total: d.total, page: 1 });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setFailed({
            key: condKey,
            message: e instanceof Error && e.message ? e.message : "动态加载失败",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [condKey, retryTick]);

  const current = settled && settled.key === condKey ? settled : null;
  const currentError = failed && failed.key === condKey && !current ? failed.message : null;
  const status: ListStatus = current ? "ready" : currentError ? "error" : "loading";
  const posts = current?.list ?? [];
  const total = current?.total ?? 0;
  const hasMore = posts.length < total;

  const loadMore = async () => {
    if (!current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const [, k, c, r] = JSON.parse(condKey) as [
      CommunityPostType,
      string,
      string | null,
      string | null,
    ];
    try {
      const d = await fetchCommunityPosts({
        page: current.page + 1,
        pageSize: PAGE_SIZE,
        type,
        keyword: k,
        cuisine: c,
        region: r,
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

  const filtered = Boolean(keyword || (type === "food" && (cuisine || region)));

  return (
    <div>
      <PageHead title={section.title} subtitle={section.subtitle} />

      <div className="site-container pt-6 sm:pt-8">
        <div className="mb-1">
          <Link href="/community" className="t-brand text-sm underline-offset-4 hover:underline">
            ← 返回社区广场
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            className="site-input min-w-0 flex-1"
            placeholder={section.placeholder}
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setKeyword(keywordDraft.trim());
            }}
            aria-label="搜索动态"
          />
          <button
            type="button"
            className="site-btn site-btn--primary shrink-0"
            onClick={() => setKeyword(keywordDraft.trim())}
          >
            搜索
          </button>
          <button
            type="button"
            className="site-btn site-btn--ghost shrink-0"
            onClick={() => setPublishOpen(true)}
          >
            ＋发布
          </button>
        </div>

        {/* 美食板块专属筛选（菜系/地区单选，即点即滤） */}
        {type === "food" ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {CUISINE_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`site-filterchip${cuisine === c ? " site-filterchip--on" : ""}`}
                onClick={() => setCuisine(cuisine === c ? null : c)}
              >
                {c}
              </button>
            ))}
            <span className="mx-1 hidden h-4 w-px sm:block" style={{ backgroundColor: "var(--line)" }} />
            {COMMUNITY_REGIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`site-filterchip${region === r.value ? " site-filterchip--on" : ""}`}
                onClick={() => setRegion(region === r.value ? null : r.value)}
              >
                {r.label}
              </button>
            ))}
            {cuisine || region ? (
              <button
                type="button"
                className="t-brand ml-1 text-xs underline-offset-4 hover:underline"
                onClick={() => {
                  setCuisine(null);
                  setRegion(null);
                }}
              >
                清除筛选
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="pt-5 sm:pt-6">
          {status === "loading" ? <ListSkeleton rows={4} /> : null}
          {status === "error" ? <ErrorHint message={currentError} onRetry={reload} /> : null}
          {status === "ready" && posts.length === 0 ? (
            <EmptyHint
              text={
                filtered
                  ? "没有符合条件的动态，换个筛选或关键词试试。"
                  : "这个板块还没有动态，欢迎发布第一条。"
              }
            />
          ) : null}
          {status === "ready" && posts.length > 0 ? (
            <>
              <ul className="space-y-3.5">
                {posts.map((p, i) => (
                  <li key={p.id}>
                    <Reveal delay={Math.min(i, 6) * 60}>
                    <Link
                      href={`/community/detail?id=${encodeURIComponent(p.id)}`}
                      className="site-card block px-5 py-4 transition-shadow hover:shadow-lg sm:px-6"
                    >
                      <div className="flex gap-3.5">
                        <span className="site-avatar site-display text-base" aria-hidden>
                          {p.author.slice(0, 1)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="site-display truncate text-[15px] font-bold sm:text-base">
                            {p.title}
                          </h3>
                          <p className="t-soft mt-1 line-clamp-2 text-sm">{p.content}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <span className="t-sub text-xs">{p.author}</span>
                            <time
                              className="t-sub text-xs tabular-nums"
                              dateTime={p.publishTime}
                            >
                              {formatRelative(p.publishTime)}
                            </time>
                            {p.cuisine ? (
                              <span className="site-chip site-chip--thanks">{p.cuisine}</span>
                            ) : null}
                            {p.region ? (
                              <span className="site-chip site-chip--pinned">
                                {regionLabel(p.region)}
                              </span>
                            ) : null}
                            <span className="t-sub ml-auto shrink-0 text-xs tabular-nums">
                              赞 {p.likes} · 评 {p.comments}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
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
                  <p className="t-sub text-xs">共 {total} 条动态，已经到底了</p>
                )}
              </div>
            </>
          ) : null}
        </div>

        <p className="t-sub mt-6 text-xs">
          * 动态由乡友自愿发布、不代表乡会立场；请文明发言，违规内容后台有权删除。
        </p>
      </div>

      {/* 条件挂载：关闭即卸载，重开自然回到干净表单态（栏目预选本板块） */}
      {publishOpen ? (
        <CommunityPublishDialog
          type={type}
          onClose={() => setPublishOpen(false)}
          onPublished={reload}
        />
      ) : null}
    </div>
  );
}
