"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  Form,
  Input,
  MessagePlugin,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from "tdesign-react";
import {
  apiToPickerDateTime,
  createNotice,
  deleteNotice,
  describeApiError,
  fetchAdminNotices,
  formatDateTime,
  pickerDateTimeToApi,
  updateNotice,
} from "@/lib/admin-api";
import type { Notice, NoticeSaveRequest } from "@/lib/types";

type NoticeFormValues = {
  title?: string;
  summary?: string;
  content?: string;
  pinned?: boolean;
  publishedAt?: string;
};

/**
 * 公告管理：GET/POST /tsa/admin/notices、PUT/DELETE /tsa/admin/notices/{id}。
 * 无「上下架」状态列（后端契约明确不造 status 字段），置顶用 pinned 布尔表达。
 */
export default function AdminNoticesPage() {
  const queryClient = useQueryClient();
  const notices = useQuery({ queryKey: ["admin", "notices"], queryFn: fetchAdminNotices });
  const rows = useMemo<Notice[]>(() => notices.data ?? [], [notices.data]);

  const [form] = Form.useForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "notices"] });

  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: NoticeSaveRequest }) => {
      if (input.id) await updateNotice(input.id, input.body);
      else await createNotice(input.body);
    },
    onSuccess: (_data, input) => {
      invalidate();
      setDialogOpen(false);
      MessagePlugin.success(input.id ? "公告已保存" : "公告已发布");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "保存公告失败")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      invalidate();
      MessagePlugin.success("公告已删除");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "删除公告失败")),
  });

  const openDialog = (row: Notice | null) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onConfirm = async () => {
    const valid = await form.validate();
    if (valid !== true) return;
    const v = form.getFieldsValue(true) as NoticeFormValues;
    const body: NoticeSaveRequest = {
      title: (v.title ?? "").trim(),
      summary: v.summary?.trim() ? v.summary.trim() : null,
      content: v.content ?? "",
      pinned: v.pinned === true,
      // 留空：新增取当前时间、编辑保留原发布时间（后端口径）
      publishedAt: v.publishedAt ? pickerDateTimeToApi(v.publishedAt) : null,
    };
    save.mutate({ id: editing?.id ?? null, body });
  };

  const columns = [
    {
      colKey: "title",
      title: "标题",
      width: 280,
      cell: ({ row }: { row: Notice }) => (
        <Space size="small">
          {row.pinned && (
            <Tag theme="warning" variant="light" size="small">
              置顶
            </Tag>
          )}
          <span className="truncate" title={row.title}>
            {row.title}
          </span>
        </Space>
      ),
    },
    {
      colKey: "summary",
      title: "摘要",
      cell: ({ row }: { row: Notice }) => (
        <span className="block truncate text-gray-600" title={row.summary ?? undefined}>
          {row.summary || "-"}
        </span>
      ),
    },
    {
      colKey: "publishedAt",
      title: "发布时间",
      width: 160,
      cell: ({ row }: { row: Notice }) => formatDateTime(row.publishedAt),
    },
    {
      colKey: "op",
      title: "操作",
      width: 160,
      cell: ({ row }: { row: Notice }) => (
        <Space size="small">
          <Button theme="primary" variant="text" size="small" onClick={() => openDialog(row)}>
            编辑
          </Button>
          <Popconfirm
            theme="danger"
            destroyOnClose
            content={`确认删除公告「${row.title}」？`}
            onConfirm={() => remove.mutate(row.id)}
          >
            <Button theme="danger" variant="text" size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const loadError = notices.isError ? describeApiError(notices.error, "公告加载失败") : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">公告管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            发布/维护乡会公告，官网按置顶优先、发布时间倒序展示。
          </p>
        </div>
        <Button theme="primary" onClick={() => openDialog(null)}>
          发布公告
        </Button>
      </div>

      {loadError && <Alert theme="error" className="mb-4" message={loadError} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          data={rows}
          columns={columns}
          loading={notices.isLoading}
          empty="暂无公告"
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? "编辑公告" : "发布公告"}
        width={640}
        destroyOnClose
        confirmLoading={save.isPending}
        onConfirm={onConfirm}
        onClose={() => setDialogOpen(false)}
      >
        <Form
          key={editing?.id ?? "create"}
          form={form}
          labelAlign="top"
          initialData={{
            title: editing?.title,
            summary: editing?.summary ?? undefined,
            content: editing?.content,
            pinned: editing?.pinned ?? false,
            publishedAt: editing?.publishedAt
              ? apiToPickerDateTime(editing.publishedAt)
              : undefined,
          }}
        >
          <Form.FormItem
            label="标题"
            name="title"
            rules={[{ required: true, message: "请填写公告标题" }]}
          >
            <Input placeholder="≤64 字" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem label="摘要" name="summary" help="列表页展示摘录，选填，≤200 字">
            <Input placeholder="选填" maxlength={200} clearable />
          </Form.FormItem>
          <Form.FormItem
            label="正文"
            name="content"
            rules={[{ required: true, message: "请填写公告正文" }]}
            help="纯文本，保留换行"
          >
            <Textarea placeholder="请输入公告正文" autosize={{ minRows: 8, maxRows: 16 }} />
          </Form.FormItem>
          <Form.FormItem label="置顶" name="pinned" help="置顶公告排在列表最前">
            <Switch label={["置顶", "普通"]} />
          </Form.FormItem>
          <Form.FormItem
            label="发布时间"
            name="publishedAt"
            help="留空：新增取当前时间，编辑保留原发布时间"
          >
            <DatePicker
              enableTimePicker
              valueType="YYYY-MM-DD HH:mm:ss"
              clearable
              style={{ width: "100%" }}
            />
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}
