"use client";

/**
 * CS 道具点位管理：GET/POST /tsa/admin/lineups、PUT/DELETE /tsa/admin/lineups/{id}、
 * POST /tsa/admin/lineups/image —— 官网 kevin/csgo 指南的唯一数据源，本页增删改后前台即时生效。
 * 全量 ≤200 条（后端钳上限），一次拉回后客户端关键字过滤，无服务端分页。
 * 保存为「整单覆写」语义（同公告、非 events 的 null=不改）：images 传空数组=清空截图。
 * 移动端：内容区已放开 760px 最小宽度（app-layout.module.css），本页再按 useIsNarrow
 * 裁剪表格列（名称列内嵌 地图·点位·道具 摘要）并堆叠工具栏、Dialog 收窄。
 */
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  Form,
  Image,
  Input,
  MessagePlugin,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Textarea,
} from "tdesign-react";
import {
  createLineup,
  deleteLineup,
  describeApiError,
  fetchAdminLineups,
  updateLineup,
  uploadLineupImage,
} from "@/lib/admin-api";
import { buildFileUrl } from "@/lib/api";
import { NADE_LABEL, NADE_OPTIONS } from "@/lib/lineups";
import { useIsNarrow } from "@/components/admin/shared/use-is-narrow";
import type { Lineup, LineupSaveRequest, NadeKind } from "@/lib/types";

/** 步骤录入口径：每行一条（提交按行拆分、空行忽略）；上限与后端 LineupSaveRequest 校验一致 */
const STEPS_MAX = 20;
const STEP_MAX_LEN = 200;
const IMAGES_MAX = 9;

type LineupFormValues = {
  map?: string;
  site?: string;
  kind?: NadeKind;
  name?: string;
  style?: string;
  steps?: string;
  note?: string;
};

export default function AdminLineupsPage() {
  const queryClient = useQueryClient();
  const narrow = useIsNarrow();
  const [keyword, setKeyword] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lineup | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ["admin", "lineups"],
    queryFn: fetchAdminLineups,
  });

  // 客户端关键字过滤：地图/点位/名称/方式/道具中文标签命中任一即保留（数据量小，不值得走后端分页）
  const rows = useMemo(() => {
    const all = query.data ?? [];
    const kw = keyword.trim().toLowerCase();
    if (!kw) return all;
    return all.filter((l) =>
      [l.map, l.site, l.name, l.style, NADE_LABEL[l.kind] ?? l.kind]
        .some((v) => v.toLowerCase().includes(kw)),
    );
  }, [query.data, keyword]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "lineups"] });

  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: LineupSaveRequest }) => {
      if (input.id) await updateLineup(input.id, input.body);
      else await createLineup(input.body);
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      MessagePlugin.success(editing ? "点位已保存" : "点位已新增");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "保存点位失败")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLineup(id),
    onSuccess: () => {
      invalidate();
      MessagePlugin.success("点位已删除，前台列表即时消失");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "删除点位失败")),
  });

  const openDialog = (row: Lineup | null) => {
    setEditing(row);
    setImages(row?.images ?? []);
    setDialogOpen(true);
  };

  const pickImage = async (file: File) => {
    setImageBusy(true);
    try {
      const path = await uploadLineupImage(file);
      setImages((prev) => (prev.length >= IMAGES_MAX ? prev : [...prev, path]));
    } catch (e: unknown) {
      MessagePlugin.error(describeApiError(e, "截图上传失败"));
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onConfirm = async () => {
    const valid = await form.validate();
    if (valid !== true) return;
    const v = form.getFieldsValue(true) as LineupFormValues;
    const steps = (v.steps ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (steps.length === 0) {
      MessagePlugin.warning("步骤每行一条，至少填一步");
      return;
    }
    if (steps.length > STEPS_MAX) {
      MessagePlugin.warning(`步骤最多 ${STEPS_MAX} 条`);
      return;
    }
    if (steps.some((s) => s.length > STEP_MAX_LEN)) {
      MessagePlugin.warning(`单步描述最长 ${STEP_MAX_LEN} 字`);
      return;
    }
    const body: LineupSaveRequest = {
      map: (v.map ?? "").trim(),
      site: (v.site ?? "").trim(),
      // kind 的 required 规则已在 form.validate 把关，这里只做类型收口
      kind: (v.kind ?? "smoke") as NadeKind,
      name: (v.name ?? "").trim(),
      style: (v.style ?? "").trim(),
      steps,
      note: (v.note ?? "").trim() || null,
      images,
    };
    save.mutate({ id: editing?.id ?? null, body });
  };

  const opColumn = {
    colKey: "op",
    title: "操作",
    width: narrow ? 110 : 150,
    cell: ({ row }: { row: Lineup }) => (
      <Space size="small">
        <Button theme="primary" variant="text" size="small" onClick={() => openDialog(row)}>
          编辑
        </Button>
        <Popconfirm
          theme="danger"
          destroyOnClose
          content={`确认删除点位「${row.name}」？前台 kevin/csgo 列表即时消失。`}
          onConfirm={() => remove.mutate(row.id)}
        >
          <Button theme="danger" variant="text" size="small">
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  };

  const columns = narrow
    ? [
        {
          colKey: "name",
          title: "点位",
          cell: ({ row }: { row: Lineup }) => (
            <div className="py-0.5">
              <span className="block truncate font-medium" title={row.name}>
                {row.name}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Tag theme="primary" variant="light" size="small">
                  {NADE_LABEL[row.kind]}
                </Tag>
                <span className="truncate">
                  {row.map} · {row.site}
                </span>
                {row.images.length > 0 && <span>{row.images.length} 图</span>}
              </span>
            </div>
          ),
        },
        opColumn,
      ]
    : [
        {
          colKey: "images",
          title: "截图",
          width: 88,
          cell: ({ row }: { row: Lineup }) => {
            const url = buildFileUrl(row.images[0]);
            if (!url) return <span className="text-gray-400">无</span>;
            return (
              <div className="relative inline-block">
                <Image
                  src={url}
                  alt="点位截图"
                  error="失败"
                  fit="cover"
                  style={{ width: 64, height: 44, borderRadius: 4 }}
                />
                {row.images.length > 1 && (
                  <Tag theme="primary" variant="light" size="small" className="absolute -right-2 -top-2">
                    {row.images.length}
                  </Tag>
                )}
              </div>
            );
          },
        },
        {
          colKey: "name",
          title: "名称",
          width: 220,
          cell: ({ row }: { row: Lineup }) => (
            <span className="block truncate" title={row.name}>
              {row.name}
            </span>
          ),
        },
        { colKey: "map", title: "地图", width: 100 },
        { colKey: "site", title: "点位", width: 110 },
        {
          colKey: "kind",
          title: "道具",
          width: 80,
          cell: ({ row }: { row: Lineup }) => (
            <Tag theme="primary" variant="light" size="small">
              {NADE_LABEL[row.kind]}
            </Tag>
          ),
        },
        { colKey: "style", title: "方式", width: 90 },
        {
          colKey: "steps",
          title: "步骤",
          width: 70,
          cell: ({ row }: { row: Lineup }) => `${row.steps.length} 步`,
        },
        opColumn,
      ];

  const loadError = query.isError ? describeApiError(query.error, "点位列表加载失败") : null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">CS 道具点位</h1>
          <p className="mt-1 text-sm text-gray-500">
            配置官网 kevin/csgo 指南：点位、分步说明与截图，保存后前台即时生效。
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <Input
            placeholder="搜地图/点位/名称"
            clearable
            value={keyword}
            className="min-w-0 flex-1 md:w-52 md:flex-none"
            onChange={(v) => setKeyword(String(v))}
          />
          <Button theme="primary" onClick={() => openDialog(null)}>
            新建点位
          </Button>
        </div>
      </div>

      {loadError && <Alert theme="error" className="mb-4" message={loadError} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          data={rows}
          columns={columns}
          loading={query.isLoading}
          empty={query.data?.length ? "没匹配到点位，换个关键字试试" : "暂无点位 —— 点右上角新建第一条"}
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? "编辑点位" : "新建点位"}
        width={narrow ? "94%" : 640}
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
            map: editing?.map,
            site: editing?.site,
            kind: editing?.kind,
            name: editing?.name,
            style: editing?.style,
            steps: editing?.steps.join("\n"),
            note: editing?.note ?? undefined,
          }}
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.FormItem label="地图" name="map" rules={[{ required: true, message: "请填写地图名" }]}>
              <Input placeholder="如 Mirage / Inferno" maxlength={32} clearable />
            </Form.FormItem>
            <Form.FormItem label="点位" name="site" rules={[{ required: true, message: "请填写点位名" }]}>
              <Input placeholder="归类点位名，如「警家」" maxlength={32} clearable />
            </Form.FormItem>
            <Form.FormItem label="道具类型" name="kind" rules={[{ required: true, message: "请选择道具类型" }]}>
              <Select placeholder="请选择" options={NADE_OPTIONS} style={{ width: "100%" }} />
            </Form.FormItem>
            <Form.FormItem label="投掷方式" name="style" rules={[{ required: true, message: "请填写投掷方式标签" }]}>
              <Input placeholder="站位 / 跳投 / Timing / 反弹…" maxlength={32} clearable />
            </Form.FormItem>
          </div>
          <Form.FormItem label="点位名称" name="name" rules={[{ required: true, message: "请填写点位名称" }]}>
            <Input placeholder="一句话名字，≤64 字" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem
            label="分步操作"
            name="steps"
            rules={[{ required: true, message: "请至少填写一步" }]}
            help={`每行一步（站位 → 瞄准参照 → 投掷动作），最多 ${STEPS_MAX} 步、单步 ≤${STEP_MAX_LEN} 字`}
          >
            <Textarea placeholder={"站 T 二楼口栏杆最左侧，背贴墙\n平视对准对面电线杆与屋檐交界点\n大跳松 W 落定后原地投"} autosize={{ minRows: 4, maxRows: 12 }} />
          </Form.FormItem>
          <Form.FormItem label="备注" name="note" help="用途/实战提醒，≤500 字，可空">
            <Textarea placeholder="如「双封烟的第一颗」" autosize={{ minRows: 2, maxRows: 6 }} />
          </Form.FormItem>
          <Form.FormItem label="截图" help={`jpg/png/webp ≤2MB，最多 ${IMAGES_MAX} 张；顺序即前台展示顺序`}>
            <div className="flex flex-wrap items-center gap-3">
              {images.map((p, i) => (
                <div key={`${p}-${i}`} className="relative">
                  <img
                    src={buildFileUrl(p) ?? undefined}
                    alt={`截图${i + 1}`}
                    className="h-16 w-24 rounded object-cover"
                    style={{ border: "1px solid var(--td-border-color, #e7e7e7)" }}
                  />
                  <Button
                    size="small"
                    shape="circle"
                    variant="outline"
                    theme="danger"
                    aria-label="移除截图"
                    className="absolute -right-2 -top-2"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {images.length < IMAGES_MAX && (
                <Button
                  size="small"
                  variant="outline"
                  loading={imageBusy}
                  onClick={() => fileRef.current?.click()}
                >
                  {imageBusy ? "上传中…" : "添加图片"}
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickImage(f);
                }}
              />
            </div>
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}
