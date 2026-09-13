"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  Form,
  Input,
  InputNumber,
  MessagePlugin,
  Popconfirm,
  Space,
  Table,
} from "tdesign-react";
import {
  createRewardCategory,
  deleteRewardCategory,
  describeApiError,
  fetchFoundationHome,
  fetchRewardRecords,
  formatYuan,
  updateRewardCategory,
} from "@/lib/admin-api";
import type { RewardCategorySaveRequest } from "@/lib/types";
import { numOrNull } from "@/components/admin/form-helpers";

/** 管理表格行：由公开读接口 GET /tsa/foundation 的 rewards（映射自类别表）聚合而来 */
type CategoryRow = {
  id: string;
  name: string;
  sponsor: string | null;
  amount: number | null;
  recordCount: number;
};

type CategoryFormValues = {
  name?: string;
  sponsor?: string;
  amount?: number | string | null;
  sort?: number | string | null;
};

/** 奖项类别管理：Table + Dialog 表单 CRUD；删除会连带删除其下获奖记录 */
export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const home = useQuery({ queryKey: ["foundation", "home"], queryFn: fetchFoundationHome });
  const rewards = useQuery({ queryKey: ["foundation", "rewards"], queryFn: fetchRewardRecords });

  const rows = useMemo<CategoryRow[]>(() => {
    const counts = new Map<string, number>();
    for (const r of rewards.data?.records ?? []) {
      counts.set(r.categoryId, (counts.get(r.categoryId) ?? 0) + 1);
    }
    return (home.data?.rewards ?? []).map((c) => ({
      id: c.id,
      name: c.label,
      sponsor: c.sponsor ?? null,
      amount: c.amount ?? null,
      recordCount: counts.get(c.id) ?? 0,
    }));
  }, [home.data, rewards.data]);

  const [form] = Form.useForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["foundation", "home"] });
    queryClient.invalidateQueries({ queryKey: ["foundation", "rewards"] });
  };

  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: RewardCategorySaveRequest }) => {
      if (input.id) await updateRewardCategory(input.id, input.body);
      else await createRewardCategory(input.body);
    },
    onSuccess: (_data, input) => {
      invalidate();
      setDialogOpen(false);
      MessagePlugin.success(input.id ? "类别已保存" : "类别已创建");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "保存类别失败")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRewardCategory(id),
    onSuccess: () => {
      invalidate();
      MessagePlugin.success("类别已删除");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "删除类别失败")),
  });

  const openDialog = (row: CategoryRow | null) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onConfirm = async () => {
    const valid = await form.validate();
    if (valid !== true) return;
    const v = form.getFieldsValue(true) as CategoryFormValues;
    const body: RewardCategorySaveRequest = {
      name: (v.name ?? "").trim(),
      sponsor: v.sponsor?.trim() ? v.sponsor.trim() : null,
      amount: numOrNull(v.amount),
      // sort 留空：新增时后端默认 0，编辑时后端不更新该字段（保留现值）
      sort: numOrNull(v.sort),
    };
    save.mutate({ id: editing?.id ?? null, body });
  };

  const columns = [
    { colKey: "name", title: "类别名称", width: 220, ellipsis: true },
    {
      colKey: "sponsor",
      title: "赞助人/捐赠方",
      width: 160,
      render: ({ row }: { row: CategoryRow }) => row.sponsor || "-",
    },
    {
      colKey: "amount",
      title: "奖金总额（元）",
      width: 140,
      render: ({ row }: { row: CategoryRow }) => formatYuan(row.amount),
    },
    { colKey: "recordCount", title: "获奖记录数", width: 110 },
    {
      colKey: "op",
      title: "操作",
      width: 160,
      render: ({ row }: { row: CategoryRow }) => (
        <Space size="small">
          <Button theme="primary" variant="text" size="small" onClick={() => openDialog(row)}>
            编辑
          </Button>
          <Popconfirm
            theme="danger"
            destroyOnClose
            content={`确认删除「${row.name}」？其下 ${row.recordCount} 条获奖记录将一并删除。`}
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

  const loadError = home.isError ? describeApiError(home.error, "类别数据加载失败") : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">奖项类别</h1>
          <p className="mt-1 text-sm text-gray-500">
            维护基金会奖励类别（名称/赞助人/奖金总额）。删除类别会连带删除其下获奖记录。
          </p>
        </div>
        <Button theme="primary" onClick={() => openDialog(null)}>
          新增类别
        </Button>
      </div>

      {loadError && <Alert theme="error" message={loadError} className="mb-4" />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          data={rows}
          columns={columns}
          loading={home.isLoading || rewards.isLoading}
          empty="暂无奖项类别"
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? `编辑类别：${editing.name}` : "新增奖项类别"}
        width={520}
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
            name: editing?.name,
            sponsor: editing?.sponsor ?? undefined,
            amount: editing?.amount ?? undefined,
            sort: undefined,
          }}
        >
          <Form.FormItem
            label="类别名称"
            name="name"
            rules={[{ required: true, message: "请填写奖项类别名称" }]}
          >
            <Input placeholder="如：年度奖学金颁发" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem label="赞助人/捐赠方" name="sponsor">
            <Input placeholder="选填，≤64 字" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem label="奖金总额（元）" name="amount" help="金额单位为元，用于官网展示">
            <InputNumber min={0} theme="normal" placeholder="选填" style={{ width: "100%" }} />
          </Form.FormItem>
          <Form.FormItem label="展示顺序" name="sort" help="越小越靠前；编辑时留空表示不改当前顺序">
            <InputNumber theme="normal" placeholder="默认 0" style={{ width: "100%" }} />
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}
