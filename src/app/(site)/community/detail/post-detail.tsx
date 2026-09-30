"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ErrorHint } from "@/components/site/shared/state-blocks";
import { useAsyncData } from "@/components/site/shared/use-async-data";
import {
  commentCommunityPost,
  fetchCommunityPostDetail,
  likeCommunityPost,
  regionLabel,
} from "@/lib/site-api";
import { formatRelative } from "@/lib/site-format";
import type { CommunityPostType } from "@/lib/types";

/**
 * 动态详情：正文/图片 + 点赞 + 评论区（列表按后端返回顺序展示，后端为时间倒序）。
 * 一期无登录：点赞每次访问只能点一次（按钮即灰,后端计数无去重,少点为敬）；
 * 评论者昵称为表单自由填，与发布动态同口径。
 */

/** 返回目标 = 所属板块（上一级）；detail 目前仅由两个板块页链路进入，type 必居其一 */
const BOARDS: Record<CommunityPostType, { href: string; label: string }> = {
  food: { href: "/community/food", label: "美食基地" },
  campus: { href: "/community/campus", label: "校园资讯" },
};
export default function PostDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { state, reload } = useAsyncData(
    async () => {
      if (!id) throw new Error("缺少动态编号（URL 未带 id）");
      return fetchCommunityPostDetail(id);
    },
    id ?? "",
  );

  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeErr, setLikeErr] = useState<string | null>(null);
  const [likes, setLikes] = useState<number | null>(null);

  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentErr, setCommentErr] = useState<string | null>(null);
  const [commentOk, setCommentOk] = useState(false);

  if (!id) {
    return (
      <ErrorHint
        message="链接不完整：地址中缺少动态编号"
        onRetry={() => {
          router.push("/community");
        }}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <article className="site-card p-6 sm:p-9" aria-busy="true">
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

  const post = state.data!;
  // ?? 兜底：type 声明为两栏联合，但线上旧数据若出第三种值不能崩页，退回广场首页
  const board = BOARDS[post.type] ?? { href: "/community", label: "社区广场" };
  const likeCount = likes ?? post.likes;
  const comments = post.commentsList ?? [];
  // 正文纯文本含换行：按空行切段，段内换行 pre-line 保留（同公告详情口径）
  const paragraphs = post.content.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  const onLike = async () => {
    if (liked || likeBusy) return;
    setLikeBusy(true);
    setLikeErr(null);
    try {
      const next = await likeCommunityPost(post.id);
      setLikes(next);
      setLiked(true);
    } catch (e: unknown) {
      setLikeErr(e instanceof Error && e.message ? e.message : "点赞失败，请稍后再试");
    } finally {
      setLikeBusy(false);
    }
  };

  const onComment = async () => {
    const nick = author.trim();
    const c = text.trim();
    if (!nick) return setCommentErr("请填写昵称");
    if (!c) return setCommentErr("评论内容不能为空");
    if (c.length > 500) return setCommentErr("评论内容最长 500 个字");
    setCommentBusy(true);
    setCommentErr(null);
    setCommentOk(false);
    try {
      await commentCommunityPost(post.id, { author: nick, content: c });
      setText("");
      setCommentOk(true);
      reload(); // 重拉详情：评论列表与条数以后端为准
    } catch (e: unknown) {
      setCommentErr(e instanceof Error && e.message ? e.message : "评论失败，请稍后再试");
    } finally {
      setCommentBusy(false);
    }
  };

  return (
    <article>
      <div className="mb-4">
        <Link href={board.href} className="t-brand text-sm underline-offset-4 hover:underline">
          ← 返回{board.label}
        </Link>
      </div>

      <div className="site-card p-6 sm:p-9">
        {/* 作者行 + 栏目/标签 */}
        <div className="flex items-center gap-3">
          <span className="site-avatar site-display text-base" aria-hidden>
            {post.author.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{post.author}</p>
            <time
              className="t-sub block text-xs tabular-nums"
              dateTime={post.publishTime}
            >
              {formatRelative(post.publishTime)}发布
            </time>
          </div>
          <span className={`site-chip ${post.type === "food" ? "site-chip--thanks" : "site-chip--pinned"}`}>
            {board.label}
          </span>
        </div>

        <h1 className="site-display mt-4 text-xl font-bold leading-snug sm:text-[26px] sm:leading-snug">
          {post.title}
        </h1>

        {post.cuisine || post.region ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.cuisine ? <span className="site-chip site-chip--thanks">{post.cuisine}</span> : null}
            {post.region ? (
              <span className="site-chip site-chip--pinned">{regionLabel(post.region)}</span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 space-y-4 text-[15px] leading-[1.9] sm:text-base sm:leading-[2]">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {/* 配图（发布接口 images 数组，有则展示） */}
        {post.images.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {post.images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block">
                {/* 外链图域名不定（小程序头像/上传域），不进 next/image 白名单，用原生 img 懒加载 */}
                <img
                  src={src}
                  alt="动态配图"
                  loading="lazy"
                  className="h-28 w-full rounded-xl object-cover sm:h-32"
                  style={{ border: "1px solid var(--line)" }}
                />
              </a>
            ))}
          </div>
        ) : null}

        {/* 点赞 */}
        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            className="site-btn"
            style={
              liked
                ? { backgroundColor: "var(--brand-soft)", color: "var(--brand-deep)", cursor: "default" }
                : { borderColor: "var(--line)", backgroundColor: "var(--card)", color: "var(--ink-2)" }
            }
            disabled={liked || likeBusy}
            onClick={onLike}
          >
            {liked ? "♡ 已赞" : "♡ 点赞"} <span className="tabular-nums">{likeCount}</span>
          </button>
          {likeErr ? (
            <span className="text-xs" style={{ color: "#c93756" }} role="alert">
              {likeErr}
            </span>
          ) : null}
        </div>
      </div>

      {/* ---------- 评论区 ---------- */}
      <section className="mt-8" aria-label="评论">
        <h2 className="site-display text-lg font-bold">评论 · {post.comments}</h2>

        <div className="site-card mt-3 overflow-hidden">
          <div className="px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2.5">
              <input
                className="site-input"
                maxLength={32}
                placeholder="你的昵称"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                aria-label="评论昵称"
              />
              <textarea
                className="site-textarea"
                rows={3}
                maxLength={500}
                placeholder="说点什么，最多 500 字"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="评论内容"
              />
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs"
                  style={{ color: commentErr ? "#c93756" : "var(--ink-3)" }}
                  role={commentErr ? "alert" : undefined}
                >
                  {commentErr ??
                    (commentOk ? "已提交，审核通过后展示" : "评论经秘书处审核后以昵称公开展示")}
                </span>
                <button
                  type="button"
                  className="site-btn site-btn--primary shrink-0"
                  disabled={commentBusy}
                  onClick={onComment}
                >
                  {commentBusy ? "发表中…" : "发表评论"}
                </button>
              </div>
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="site-divide">
              <p className="t-sub px-5 py-6 text-center text-sm sm:px-6">
                还没有评论，来抢个沙发。
              </p>
            </div>
          ) : (
            <ul className="site-divide">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3 px-5 py-4 sm:px-6">
                  <span className="site-avatar site-display text-sm" aria-hidden>
                    {c.author.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-sm font-medium">{c.author}</span>
                      <time
                        className="t-sub text-xs tabular-nums"
                        dateTime={c.createTime}
                      >
                        {formatRelative(c.createTime)}
                      </time>
                      {c.likes ? (
                        <span className="t-sub text-xs tabular-nums">赞 {c.likes}</span>
                      ) : null}
                    </div>
                    <p className="t-soft mt-0.5 whitespace-pre-line text-sm">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="t-sub mt-4 text-center text-xs sm:text-sm">
          内容由乡友自主发布，不代表乡会立场 ·
          <Link href="/community" className="t-brand mx-1 underline-offset-4 hover:underline">
            继续逛广场
          </Link>
        </p>
      </section>
    </article>
  );
}
