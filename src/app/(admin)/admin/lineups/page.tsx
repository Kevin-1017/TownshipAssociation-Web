"use client";

/**
 * CS 道具点位管理：GET/POST /tsa/admin/lineups、PUT/DELETE /tsa/admin/lineups/{id}、
 * POST /tsa/admin/lineups/image —— 官网 kevin/csgo 指南的唯一数据源，本页增删改后前台即时生效。
 * 全量 ≤200 条（后端钳上限），一次拉回后客户端关键字过滤，无服务端分页。
 * 保存为「整单覆写」语义（同公告、非 events 的 null=不改）：images 传空数组=清空截图。
 * 2026-10-16 精简：删点位（site）与分步操作（steps）；道具类型改中文枚举（烟/闪/火/雷/诱饵）；
 * 表单口径——地图为十图下拉（候选见 lib/lineups.ts 的 CS_MAPS），点位名称紧随其后第二位填写，
 * 投掷方式挪到原分步操作的位置。
 * 移动端：内容区已放开 760px 最小宽度（app-layout.module.css），本页再按 useIsNarrow
 * 裁剪表格列（名称列内嵌 地图·道具 摘要）、收窄搜索框（新增按钮始终钉在标题行右上角）、Dialog 收窄。
 * 宽屏截图列为缩略图，点击进 ImageViewer 预览（整行 images 一起传入，可左右切换；遮罩/ESC/关闭按钮关）。
 * 2026-11-03 表头筛选：地图/道具两列各挂 single 筛选器，候选只列有数据的值（字典外的历史值排尾部，
 * 不会看不见）、「全部」即清空，点选即时生效（不套确认按钮），与关键字搜索 AND 叠加。
 * 接口 GET /tsa/admin/lineups 无查询参数，筛选一律在已拉回的全量数组上做，不发请求。
 * 窄屏精简列集没有这两列 → 筛选入口挪成表格上方两个 Select（同一段 filterValues，口径不分叉）；
 * 另起一行「命中 x / 共 y 条」把关键字与筛选的结果写在明面上（Table 自带的那行用 filterRow={null} 关掉）。
 */
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrowseIcon } from "tdesign-icons-react";
import {
  Alert,
  Button,
  Dialog,
  Form,
  Image,
  ImageViewer,
  Input,
  MessagePlugin,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Textarea,
  type TableColumnFilter,
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
import { CS_MAPS, MAP_OPTIONS, NADE_KINDS, NADE_OPTIONS } from "@/lib/lineups";
import { useIsNarrow } from "@/components/admin/shared/use-is-narrow";
import type { Lineup, LineupSaveRequest, NadeKind } from "@/lib/types";

const IMAGES_MAX = 9;

type LineupFormValues = {
  map?: string;
  kind?: NadeKind;
  name?: string;
  style?: string;
  note?: string;
};

/** 表头筛选值（Table 的 filterValue 只取这两个 colKey，空串 = 该维度不过滤） */
type LineupFilterValues = {
  map?: string;
  kind?: string;
};

const FILTER_ALL = { label: "全部", value: "" };

export default function AdminLineupsPage() {
  const queryClient = useQueryClient();
  const narrow = useIsNarrow();
  const [keyword, setKeyword] = useState("");
  // Table 侧走非受控（筛选面板自己维护浮层草稿），这里只镜像出确认后的值做本地过滤
  const [filterValues, setFilterValues] = useState<LineupFilterValues>({});

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

  // 客户端关键字 + 表头筛选（地图/道具）叠加过滤，均为 AND 语义；数据量小，不值得走后端分页
  const rows = useMemo(() => {
    const all = query.data ?? [];
    const byMap = filterValues.map ?? "";
    const byKind = filterValues.kind ?? "";
    const kw = keyword.trim().toLowerCase();
    return all.filter((l) => {
      if (byMap && l.map !== byMap) return false;
      if (byKind && l.kind !== byKind) return false;
      if (!kw) return true;
      return [l.map, l.name, l.kind, l.style].some((v) => v.toLowerCase().includes(kw));
    });
  }, [query.data, keyword, filterValues]);

  // 筛选候选只列「有数据」的值：先按字典顺序（地图 CS_MAPS、道具 NADE_KINDS），字典外的历史值
  // （两列后端都是自由文本，旧记录可能留着迁移前的写法）排序垫底 —— 否则老值既筛不出也看不见。
  // 首位「全部」即清空：single 型筛器是 radio，选中后无法反选，只能靠它回到不过滤态。
  const filterLists = useMemo(() => {
    const all = query.data ?? [];
    const ordered = (values: string[], dict: readonly string[]) => {
      const known = dict.filter((v) => values.includes(v));
      const rest = values.filter((v) => !known.includes(v)).sort();
      return [FILTER_ALL, ...[...known, ...rest].map((v) => ({ label: v, value: v }))];
    };
    return {
      map: ordered([...new Set(all.map((l) => l.map))], CS_MAPS),
      kind: ordered([...new Set(all.map((l) => l.kind))], NADE_KINDS),
    };
  }, [query.data]);

  const filterActive = Boolean(filterValues.map || filterValues.kind);

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
    const body: LineupSaveRequest = {
      map: (v.map ?? "").trim(),
      // kind 的 required 规则已在 form.validate 把关，这里只做类型收口
      kind: (v.kind ?? "烟") as NadeKind,
      name: (v.name ?? "").trim(),
      style: (v.style ?? "").trim(),
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
                  {row.kind}
                </Tag>
                <span className="truncate">{row.map}</span>
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
            const urls = row.images
              .map((p) => buildFileUrl(p))
              .filter((u): u is string => u !== null);
            if (!urls.length) return <span className="text-gray-400">无</span>;
            return (
              <ImageViewer
                images={urls}
                title={`${row.map} · ${row.name}`}
                trigger={({ open }) => (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`预览「${row.name}」的 ${urls.length} 张截图`}
                    className="relative inline-block cursor-pointer outline-none"
                    onClick={() => open(0)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      open(0);
                    }}
                  >
                    <Image
                      src={urls[0]}
                      alt="点位截图"
                      error="失败"
                      fit="cover"
                      overlayTrigger="hover"
                      overlayContent={
                        <span className="flex h-full w-full items-center justify-center rounded bg-black/50 text-white">
                          <BrowseIcon size="1.2em" />
                        </span>
                      }
                      style={{ width: 64, height: 44, borderRadius: 4 }}
                    />
                    {urls.length > 1 && (
                      <Tag theme="primary" variant="light" size="small" className="absolute -right-5 -top-2">
                        {urls.length}
                      </Tag>
                    )}
                  </div>
                )}
              />
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
        {
          colKey: "map",
          title: "地图",
          width: 100,
          filter: { type: "single", list: filterLists.map } satisfies TableColumnFilter,
        },
        {
          colKey: "kind",
          title: "道具",
          width: 80,
          filter: { type: "single", list: filterLists.kind } satisfies TableColumnFilter,
          cell: ({ row }: { row: Lineup }) => (
            <Tag theme="primary" variant="light" size="small">
              {row.kind}
            </Tag>
          ),
        },
        { colKey: "style", title: "方式", width: 90 },
        opColumn,
      ];

  const loadError = query.isError ? describeApiError(query.error, "点位列表加载失败") : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">
            配置官网 kevin/csgo 指南：点位名称、投掷方式与截图，保存后前台即时生效。
          </p>
        </div>
        <Space>
          <Input
            placeholder="搜地图/名称/道具"
            clearable
            value={keyword}
            style={{ width: narrow ? 132 : 200 }}
            onChange={(v) => setKeyword(String(v))}
          />
          <Button theme="primary" onClick={() => openDialog(null)}>
            新增点位
          </Button>
        </Space>
      </div>

      {/* 窄屏精简列集里没有地图/道具两列，表头筛选器随列消失 —— 筛选入口挪到表格上方一行 */}
      {narrow && (
        <div className="mb-3 flex shrink-0 items-center gap-2">
          <Select
            placeholder="地图"
            value={filterValues.map || undefined}
            options={filterLists.map}
            style={{ width: 140 }}
            onChange={(v) => setFilterValues((prev) => ({ ...prev, map: String(v ?? "") }))}
          />
          <Select
            placeholder="道具"
            value={filterValues.kind || undefined}
            options={filterLists.kind}
            style={{ width: 110 }}
            onChange={(v) => setFilterValues((prev) => ({ ...prev, kind: String(v ?? "") }))}
          />
        </div>
      )}

      {/* 命中数写行：筛选/关键字是否真的落下去了，一眼可见（Table 自带的搜索结果行已用 filterRow={null} 关掉） */}
      {(keyword.trim() || filterActive) && (
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>
            命中 {rows.length} / 共 {(query.data ?? []).length} 条
            {filterActive &&
              `（地图：${filterValues.map || "不限"}；道具：${filterValues.kind || "不限"}）`}
          </span>
          {filterActive && (
            <Button
              size="small"
              variant="text"
              theme="primary"
              onClick={() => setFilterValues({ map: "", kind: "" })}
            >
              清空筛选
            </Button>
          )}
        </div>
      )}

      {loadError && <Alert theme="error" className="mb-4 shrink-0" message={loadError} />}

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          className="admin-table-fill"
          maxHeight="100%"
          data={rows}
          columns={columns}
          loading={query.isLoading}
          filterValue={filterValues}
          filterRow={null}
          onFilterChange={(v) =>
            setFilterValues({
              map: typeof v.map === "string" ? v.map : "",
              kind: typeof v.kind === "string" ? v.kind : "",
            })
          }
          empty={
            query.data?.length
              ? "没匹配到点位，换个关键字或清掉表头筛选"
              : "暂无点位 —— 点右上角「新增点位」加第一条"
          }
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? "编辑点位" : "新增点位"}
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
            kind: editing?.kind,
            name: editing?.name,
            style: editing?.style,
            note: editing?.note ?? undefined,
          }}
        >
          <Form.FormItem label="地图" name="map" rules={[{ required: true, message: "请选择地图" }]}>
            <Select placeholder="请选择" options={MAP_OPTIONS} style={{ width: "100%" }} />
          </Form.FormItem>
          <Form.FormItem label="点位名称" name="name" rules={[{ required: true, message: "请填写点位名称" }]}>
            <Input placeholder="一句话名字，≤64 字" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem label="道具类型" name="kind" rules={[{ required: true, message: "请选择道具类型" }]}>
            <Select placeholder="请选择" options={NADE_OPTIONS} style={{ width: "100%" }} />
          </Form.FormItem>
          <Form.FormItem label="投掷方式" name="style" rules={[{ required: true, message: "请填写投掷方式标签" }]}>
            <Input placeholder="站位 / 跳投 / Timing / 反弹…" maxlength={32} clearable />
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
