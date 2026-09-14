"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Image,
  MessagePlugin,
  Popconfirm,
  RadioGroup,
  Space,
  Table,
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
import type { CommunityComment, CommunityPost } from "@/lib/types";

/**
 * 社区审核（2026-09-14 帖子 / 2026-09-15 评论）：官网社区的动态与评论都先落待审，
 * 通过后才对外；驳回可恢复（再传 1 即回通过）。
 * GET/PUT /tsa/admin/community/posts[...]、GET/PUT /tsa/admin/community/comments[...]。
 */

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type Target = "posts" | "comments";

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

export default function AdminCommunityPage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target>("posts");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);

  const posts = useQuery({
    queryKey: ["admin", "community", "posts", status, page],
    queryFn: () =>
      fetchAdminCommunityPosts({ page, pageSize: PAGE_SIZE, status: STATUS_PARAM[status] }),
    enabled: target === "posts",
  });
  const comments = useQuery({
    queryKey: ["admin", "community", "comments", status, page],
    queryFn: () =>
      fetchAdminComments({ page, pageSize: PAGE_SIZE, status: STATUS_PARAM[status] }),
    enabled: target === "comments",
  });

  const active = target === "posts" ? posts : comments;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "community"] });

  // 帖子/评论共用一条 mutation 管道：kind 决定打哪个端点与提示文案
  const audit = useMutation({
    mutationFn: ({ kind, id, target: t }: { kind: Target; id: string; target: 1 | 2 }) =>
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
  const auditOps = (
    kind: Target,
    row: { id: string; status?: number | null },
    label: string,
  ) => {
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

  const postColumns = [
    {
      colKey: "images",
      title: "配图",
      width: 80,
      render: ({ row }: { row: CommunityPost }) => {
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
      colKey: "title",
      title: "标题 / 正文",
      width: 240,
      render: ({ row }: { row: CommunityPost }) => (
        <div>
          <p className="font-medium" title={row.title}>
            {row.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500" title={row.content}>
            {row.content}
          </p>
        </div>
      ),
    },
    {
      colKey: "meta",
      title: "栏目 / 作者",
      width: 150,
      render: ({ row }: { row: CommunityPost }) => (
        <div>
          <Tag variant="light" size="small" theme="primary">
            {row.type === "food" ? "美食基地" : "校园广场"}
          </Tag>
          <div className="mt-1 text-xs text-gray-500">{row.author}</div>
        </div>
      ),
    },
    {
      colKey: "stats",
      title: "数据",
      width: 130,
      render: ({ row }: { row: CommunityPost }) => (
        <span className="text-xs text-gray-500">
          赞 {row.likes} · 评 {row.comments}
          <br />
          {formatDateTime(row.publishTime)}
        </span>
      ),
    },
    {
      colKey: "status",
      title: "状态",
      width: 90,
      render: ({ row }: { row: CommunityPost }) => statusTag(row.status),
    },
    {
      colKey: "op",
      title: "操作",
      width: 150,
      render: ({ row }: { row: CommunityPost }) => auditOps("posts", row, row.title),
    },
  ];

  const commentColumns = [
    {
      colKey: "content",
      title: "评论内容",
      render: ({ row }: { row: CommunityComment }) => (
        <p className="line-clamp-3" title={row.content}>
          {row.content}
        </p>
      ),
    },
    {
      colKey: "author",
      title: "评论者",
      width: 120,
      render: ({ row }: { row: CommunityComment }) => (
        <span className="text-sm">{row.author}</span>
      ),
    },
    {
      colKey: "postId",
      title: "所属动态",
      width: 100,
      render: ({ row }: { row: CommunityComment }) => (
        <span className="text-xs text-gray-500">动态 #{row.postId ?? "-"}</span>
      ),
    },
    {
      colKey: "createTime",
      title: "评论时间",
      width: 160,
      render: ({ row }: { row: CommunityComment }) => (
        <span className="text-xs text-gray-500">{formatDateTime(row.createTime)}</span>
      ),
    },
    {
      colKey: "status",
      title: "状态",
      width: 90,
      render: ({ row }: { row: CommunityComment }) => statusTag(row.status),
    },
    {
      colKey: "op",
      title: "操作",
      width: 150,
      render: ({ row }: { row: CommunityComment }) =>
        auditOps("comments", row, row.content.slice(0, 12)),
    },
  ];

  const loadError = active.isError ? describeApiError(active.error, "审核队列加载失败") : null;

  const pagination = (total: number) => ({
    current: page,
    pageSize: PAGE_SIZE,
    total,
    onChange: (p: { current: number }) => setPage(p.current),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">社区审核</h1>
          <p className="mt-1 text-sm text-gray-500">
            官网社区的动态与评论都先落待审，通过后才对外；驳回可恢复。
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <RadioGroup
          value={target}
          theme="button"
          variant="default-filled"
          size="small"
          options={[
            { value: "posts", label: "动态" },
            { value: "comments", label: "评论" },
          ]}
          onChange={(v) => {
            setTarget(v as Target);
            setPage(1);
          }}
        />
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
        {target === "posts" ? (
          <Table
            rowKey="id"
            data={posts.data?.list ?? []}
            columns={postColumns}
            loading={posts.isLoading}
            empty="暂无符合条件的动态"
            pagination={pagination(posts.data?.total ?? 0)}
          />
        ) : (
          <Table
            rowKey="id"
            data={comments.data?.list ?? []}
            columns={commentColumns}
            loading={comments.isLoading}
            empty="暂无符合条件的评论"
            pagination={pagination(comments.data?.total ?? 0)}
          />
        )}
      </div>
    </div>
  );
}
