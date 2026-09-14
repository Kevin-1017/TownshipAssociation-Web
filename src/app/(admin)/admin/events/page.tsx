"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  Form,
  Image,
  Input,
  MessagePlugin,
  Popconfirm,
  Space,
  Table,
  Tag,
} from "tdesign-react";
import {
  apiToPickerDateTime,
  createEvent,
  deleteEvent,
  describeApiError,
  fetchAdminEvents,
  formatDateTime,
  pickerDateTimeToApi,
  updateEvent,
  uploadEventCover,
  type EventSavePayload,
} from "@/lib/admin-api";
import { buildFileUrl } from "@/lib/api";
import type { EventListItem } from "@/lib/types";

/**
 * 乡会事件管理（2026-09-14 管理端配置入口）：
 * GET/POST /tsa/admin/events、PUT/DELETE /tsa/admin/events/{id}、POST /tsa/admin/events/cover。
 * 字段=用户定稿三件套（图片、标题、公众号 url）+ 开始时间（排序/年份筛选依据）；
 * 「删除即下架」——逻辑删除后官网/小程序公开列表即时查无，无发布/下架开关。
 * cover 清除走空串（后端 null=不改、""=清除）；summary 不在管理表单内（保留库值）。
 */

const PAGE_SIZE = 10;

type EventFormValues = {
  title?: string;
  startTime?: string;
  articleUrl?: string;
};

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [keywordApplied, setKeywordApplied] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventListItem | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  const events = useQuery({
    queryKey: ["admin", "events", page, keywordApplied],
    queryFn: () => fetchAdminEvents({ page, pageSize: PAGE_SIZE, keyword: keywordApplied || null }),
  });
  const rows = useMemo<EventListItem[]>(() => events.data?.list ?? [], [events.data]);
  const total = events.data?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "events"] });

  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: EventSavePayload }) => {
      if (input.id) await updateEvent(input.id, input.body);
      else await createEvent(input.body);
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      MessagePlugin.success(editing ? "事件已保存" : "事件已发布");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "保存事件失败")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      invalidate();
      MessagePlugin.success("事件已下架（逻辑删除，可追溯）");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "删除事件失败")),
  });

  const openDialog = (row: EventListItem | null) => {
    setEditing(row);
    setCover(row?.cover ?? null);
    setDialogOpen(true);
  };

  const pickCover = async (file: File) => {
    setCoverBusy(true);
    try {
      setCover(await uploadEventCover(file));
    } catch (e: unknown) {
      MessagePlugin.error(describeApiError(e, "封面上传失败"));
    } finally {
      setCoverBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onConfirm = async () => {
    const valid = await form.validate();
    if (valid !== true) return;
    const v = form.getFieldsValue(true) as EventFormValues;
    const body: EventSavePayload = {
      title: (v.title ?? "").trim(),
      // 未选/已移除都传空串=清除（新建时空串落库即无封面）
      cover: cover ?? "",
      summary: null,
      articleUrl: (v.articleUrl ?? "").trim(),
      startTime: pickerDateTimeToApi(v.startTime ?? ""),
    };
    save.mutate({ id: editing?.id ?? null, body });
  };

  const columns = [
    {
      colKey: "cover",
      title: "封面",
      width: 88,
      render: ({ row }: { row: EventListItem }) => {
        const url = buildFileUrl(row.cover);
        if (!url) return <span className="text-gray-400">无</span>;
        return (
          <Image
            src={url}
            alt="封面"
            error="失败"
            fit="cover"
            style={{ width: 64, height: 44, borderRadius: 4 }}
          />
        );
      },
    },
    {
      colKey: "title",
      title: "标题",
      width: 260,
      render: ({ row }: { row: EventListItem }) => (
        <span className="block truncate" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      colKey: "articleUrl",
      title: "公众号链接",
      width: 110,
      render: ({ row }: { row: EventListItem }) =>
        row.articleUrl ? (
          <a href={row.articleUrl} target="_blank" rel="noopener noreferrer">
            <Tag theme="primary" variant="light" size="small">
              查看 ↗
            </Tag>
          </a>
        ) : (
          <Tag theme="warning" variant="light" size="small">
            整理中
          </Tag>
        ),
    },
    {
      colKey: "startTime",
      title: "开始时间",
      width: 160,
      render: ({ row }: { row: EventListItem }) => formatDateTime(row.startTime),
    },
    {
      colKey: "status",
      title: "展示态",
      width: 90,
      render: ({ row }: { row: EventListItem }) =>
        row.status === "upcoming" ? (
          <Tag theme="success" variant="light" size="small">
            近期
          </Tag>
        ) : (
          <Tag variant="light" size="small">
            往期
          </Tag>
        ),
    },
    {
      colKey: "op",
      title: "操作",
      width: 150,
      render: ({ row }: { row: EventListItem }) => (
        <Space size="small">
          <Button theme="primary" variant="text" size="small" onClick={() => openDialog(row)}>
            编辑
          </Button>
          <Popconfirm
            theme="danger"
            destroyOnClose
            content={`确认删除事件「${row.title}」？删除即下架，官网与小程序不再展示。`}
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

  const loadError = events.isError ? describeApiError(events.error, "事件列表加载失败") : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">乡会事件</h1>
          <p className="mt-1 text-sm text-gray-500">
            配置官网/小程序展示的事件：封面 + 标题 + 公众号链接；删除即下架。
          </p>
        </div>
        <Space>
          <Input
            placeholder="搜标题"
            clearable
            value={keyword}
            style={{ width: 200 }}
            onChange={(v) => {
              setKeyword(String(v));
              if (v === "") {
                setKeywordApplied("");
                setPage(1);
              }
            }}
            onEnter={() => {
              setKeywordApplied(keyword.trim());
              setPage(1);
            }}
          />
          <Button theme="primary" onClick={() => openDialog(null)}>
            新建事件
          </Button>
        </Space>
      </div>

      {loadError && <Alert theme="error" className="mb-4" message={loadError} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          data={rows}
          columns={columns}
          loading={events.isLoading}
          empty="暂无事件"
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: (p) => setPage(p.current),
          }}
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? "编辑事件" : "新建事件"}
        width={560}
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
            startTime: editing ? apiToPickerDateTime(editing.startTime) : undefined,
            articleUrl: editing?.articleUrl ?? undefined,
          }}
        >
          <Form.FormItem
            label="标题"
            name="title"
            rules={[{ required: true, message: "请填写事件标题" }]}
          >
            <Input placeholder="≤64 字" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem
            label="开始时间"
            name="startTime"
            rules={[{ required: true, message: "请选择开始时间" }]}
            help="列表排序与官网年份筛选都按这个时间"
          >
            <DatePicker
              enableTimePicker
              valueType="YYYY-MM-DD HH:mm:ss"
              clearable
              style={{ width: "100%" }}
            />
          </Form.FormItem>
          <Form.FormItem
            label="公众号文章链接"
            name="articleUrl"
            help="留空则官网卡片显示「整理中」且不可点"
          >
            <Input placeholder="https://mp.weixin.qq.com/s/……" clearable />
          </Form.FormItem>
          <Form.FormItem label="封面图" help="jpg/png/webp ≤2MB；不选=占位字卡片">
            <div className="flex items-center gap-3">
              {cover ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildFileUrl(cover) ?? undefined}
                    alt="封面预览"
                    className="h-16 w-24 rounded object-cover"
                    style={{ border: "1px solid var(--td-border-color, #e7e7e7)" }}
                  />
                  <Button size="small" variant="text" theme="danger" onClick={() => setCover(null)}>
                    移除
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  variant="outline"
                  loading={coverBusy}
                  onClick={() => fileRef.current?.click()}
                >
                  {coverBusy ? "上传中…" : "选择图片"}
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickCover(f);
                }}
              />
            </div>
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}
