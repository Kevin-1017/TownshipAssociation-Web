"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  EnhancedTable,
  Image,
  MessagePlugin,
  Popconfirm,
  RadioGroup,
  Space,
  Tag,
} from "tdesign-react";
import {
  auditComment,
  auditCommunityPost,
  describeApiError,
  fetchAdminComments,
  fetchAdminCommunityPosts,
  formatDateTime,
} from "@/lib/admin-api";
import { buildFileUrl } from "@/lib/api";
import type { CommunityComment, CommunityPost, CommunityPostType } from "@/lib/types";

/**
 * 社区审核台（按栏目拆分，2026-09-29）：/admin/community/{food|campus} 各挂一个实例。
 * 单棵树，不再分「动态/评论」页签——状态筛选是统一审核态：
 * - 待审核/已驳回：命中「动态本身处于该状态」或「其下同状态评论」（后端 status OR 语义）；
 * - 已通过：只命中已过审动态；
 * - 全部：动态与其下全部评论。
 * 子级评论同样按当前状态过滤（postId+status 走现有评论接口），展开只见同状态评论。
 * 动态/评论都先落待审，通过后才对外；驳回可恢复（再传 1 即回通过）。
 * GET/PUT /tsa/admin/community/posts[...]、GET/PUT /tsa/admin/community/comments[...]。
 */

type StatusFilter = "pending" | "approved" | "rejected" | "all";
/** 行实体类型：树里动态与评论共用一套列，kind 决定渲染分支与审核端点 */
type Kind = "posts" | "comments";

const STATUS_PARAM: Record<StatusFilter, number | null> = {
  pending: 0,
  approved: 1,
  rejected: 2,
  all: null,
};

const STATUS_LABEL: Record<StatusFilter, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
  all: "全部",
};

const CHANNEL_LABEL: Record<CommunityPostType, string> = {
  food: "美食基地",
  campus: "校园资讯",
};

/** 树形子级：单条动态下评论的一次性拉取上限（后端 pageSize 钳到 100） */
const CHILD_PAGE_SIZE = 100;

/**
 * 树形行：动态与评论共用一套列。
 * uid 加 p-/c- 前缀做 rowKey——两张表的自增 id 会撞号，不能直接用 id。
 */
interface TreeRow {
  uid: string;
  kind: Kind;
  id: string;
  author: string;
  content: string;
  status?: number | null;
  // 动态行字段
  title?: string;
  images?: string[];
  comments?: number;
  publishTime?: string;
  // 评论行字段
  createTime?: string;
  /** 动态 likes: number，评论 likes: number|null，此处放宽为并集 */
  likes?: number | null;
  children?: TreeRow[];
}

function toPostRow(post: CommunityPost, kids: CommunityComment[]): TreeRow {
  return {
    ...post,
    uid: `p-${post.id}`,
    kind: "posts",
    children: kids.map((c) => ({ ...c, uid: `c-${c.id}`, kind: "comments" as Kind })),
  };
}

function statusTag(status?: number | null) {
  if (status === 0)
    return (
      <Tag theme="warning" variant="light" size="small">
        待审核
      </Tag>
    );
  if (status === 1)
    return (
      <Tag theme="success" variant="light" size="small">
        已通过
      </Tag>
    );
  if (status === 2)
    return (
      <Tag theme="danger" variant="light" size="small">
        已驳回
      </Tag>
    );
  return <span className="text-gray-400">-</span>;
}

const PAGE_SIZE = 10;

export default function CommunityConsole({ channel }: { channel: CommunityPostType }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);

  // 树形数据：本页动态逐条并行拉同状态评论（status=all 时不带状态=全部评论）拼进 children
  const postTree = useQuery({
    queryKey: ["admin", "community", "posts-tree", channel, status, page],
    queryFn: async () => {
      const p = await fetchAdminCommunityPosts({
        page,
        pageSize: PAGE_SIZE,
        status: STATUS_PARAM[status],
        type: channel,
      });
      const kids = await Promise.all(
        p.list.map((post) =>
          fetchAdminComments({
            page: 1,
            pageSize: CHILD_PAGE_SIZE,
            postId: post.id,
            status: STATUS_PARAM[status],
          }),
        ),
      );
      return {
        total: p.total,
        rows: p.list.map((post, i) => toPostRow(post, kids[i].list)),
      };
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "community"] });

  // 帖子/评论共用一条 mutation 管道：kind 决定打哪个端点与提示文案
  const audit = useMutation({
    mutationFn: ({ kind, id, target: t }: { kind: Kind; id: string; target: 1 | 2 }) =>
      kind === "posts" ? auditCommunityPost(id, t) : auditComment(id, t),
    onSuccess: (_d, v) => {
      invalidate();
      MessagePlugin.success(
        v.target === 1
          ? v.kind === "posts"
            ? "已通过审核，动态已上线"
            : "评论已通过，将随详情展示"
          : "已驳回（可恢复）",
      );
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "审核操作失败")),
  });

  /** 三态动作区：待审=通过/驳回，已过=驳回（下架），已驳=恢复上架 */
  const auditOps = (kind: Kind, row: { id: string; status?: number | null }, label: string) => {
    if (row.status === 1) {
      return (
        <Popconfirm
          theme="danger"
          destroyOnClose
          content={`确认驳回「${label}」？驳回后不再对外展示。`}
          onConfirm={() => audit.mutate({ kind, id: row.id, target: 2 })}
        >
          <Button theme="danger" variant="text" size="small">
            驳回
          </Button>
        </Popconfirm>
      );
    }
    if (row.status === 2) {
      return (
        <Button
          theme="primary"
          variant="text"
          size="small"
          disabled={audit.isPending}
          onClick={() => audit.mutate({ kind, id: row.id, target: 1 })}
        >
          恢复上架
        </Button>
      );
    }
    return (
      <Space size="small">
        <Button
          theme="primary"
          variant="text"
          size="small"
          disabled={audit.isPending}
          onClick={() => audit.mutate({ kind, id: row.id, target: 1 })}
        >
          通过
        </Button>
        <Popconfirm
          theme="danger"
          destroyOnClose
          content={`确认驳回「${label}」？`}
          onConfirm={() => audit.mutate({ kind, id: row.id, target: 2 })}
        >
          <Button theme="danger" variant="text" size="small">
            驳回
          </Button>
        </Popconfirm>
      </Space>
    );
  };

  // 树形列：第 0 列挂展开箭头（tree.treeNodeColumnIndex 默认 0），动态/评论按 kind 分支渲染
  const treeColumns = [
    {
      colKey: "title",
      title: "动态标题 / 评论内容",
      width: 280,
      cell: ({ row }: { row: TreeRow }) =>
        row.kind === "posts" ? (
          <div>
            <p className="font-medium" title={row.title}>
              {row.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500" title={row.content}>
              {row.content}
            </p>
          </div>
        ) : (
          <p className="line-clamp-3 text-sm text-gray-600" title={row.content}>
            {row.content}
          </p>
        ),
    },
    {
      colKey: "images",
      title: "配图",
      width: 80,
      cell: ({ row }: { row: TreeRow }) => {
        if (row.kind !== "posts") return <span className="text-gray-400">-</span>;
        const url = buildFileUrl(row.images?.[0]);
        if (!url) return <span className="text-gray-400">无</span>;
        return (
          <Image
            src={url}
            alt="配图"
            error="加载失败"
            fit="cover"
            style={{ width: 64, height: 48, borderRadius: 4 }}
          />
        );
      },
    },
    {
      colKey: "author",
      title: "作者",
      width: 140,
      cell: ({ row }: { row: TreeRow }) => (
        <span className={row.kind === "posts" ? "text-sm" : "text-xs text-gray-500"}>
          {row.author}
          {row.kind === "comments" && (
            <Tag variant="light" size="small" className="ml-1">
              评论
            </Tag>
          )}
        </span>
      ),
    },
    {
      colKey: "stats",
      title: "时间 / 数据",
      width: 140,
      cell: ({ row }: { row: TreeRow }) =>
        row.kind === "posts" ? (
          <span className="text-xs text-gray-500">
            赞 {row.likes} · 已过审评 {row.comments}
            <br />
            {formatDateTime(row.publishTime)}
          </span>
        ) : (
          <span className="text-xs text-gray-500">{formatDateTime(row.createTime)}</span>
        ),
    },
    {
      colKey: "status",
      title: "状态",
      width: 90,
      cell: ({ row }: { row: TreeRow }) => statusTag(row.status),
    },
    {
      colKey: "op",
      title: "操作",
      width: 150,
      cell: ({ row }: { row: TreeRow }) =>
        auditOps(
          row.kind,
          row,
          row.kind === "posts" ? (row.title ?? "") : row.content.slice(0, 12),
        ),
    },
  ];

  const loadError = postTree.isError
    ? describeApiError(postTree.error, "审核队列加载失败")
    : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">社区审核 · {CHANNEL_LABEL[channel]}</h1>
          <p className="mt-1 text-sm text-gray-500">
            只列「{CHANNEL_LABEL[channel]}」栏目。状态是统一审核态：待审核/已驳回 =
            动态本身处于该状态、或其下有同状态评论（评论只会挂在已过审动态下）；已通过 =
            已过审动态；展开只看到同状态评论，「全部」则含所有评论。通过后才对外，驳回可恢复。
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <RadioGroup
          value={status}
          theme="button"
          variant="default-filled"
          size="small"
          options={(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
          onChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(1);
          }}
        />
      </div>

      {loadError && <Alert theme="error" className="mb-4" message={loadError} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <EnhancedTable<TreeRow>
          rowKey="uid"
          data={postTree.data?.rows ?? []}
          columns={treeColumns}
          loading={postTree.isLoading}
          empty="暂无待处理的内容"
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: postTree.data?.total ?? 0,
            onChange: (p: { current: number }) => setPage(p.current),
          }}
          tree={{ childrenKey: "children", indent: 24 }}
        />
      </div>
    </div>
  );
}
