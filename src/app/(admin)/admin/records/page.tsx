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
  Select,
  Space,
  Table,
} from "tdesign-react";
import {
  createRewardRecord,
  deleteRewardRecord,
  describeApiError,
  fetchFoundationHome,
  fetchRewardRecords,
  formatYuan,
  updateRewardRecord,
} from "@/lib/admin-api";
import type { RewardRecord, RewardRecordSaveRequest } from "@/lib/types";
import { numOrNull } from "@/components/admin/form-helpers";

type RecordFormValues = {
  categoryId?: number | string;
  recipient?: string;
  amount?: number | string | null;
};

/** 获奖记录管理：数据源 GET /tsa/foundation/rewards；类别下拉来自 GET /tsa/foundation 的类别列表 */
export default function AdminRecordsPage() {
  const queryClient = useQueryClient();
  const rewards = useQuery({ queryKey: ["foundation", "rewards"], queryFn: fetchRewardRecords });
  const home = useQuery({ queryKey: ["foundation", "home"], queryFn: fetchFoundationHome });

  const rows = useMemo<RewardRecord[]>(() => rewards.data?.records ?? [], [rewards.data]);

  // 类别下拉：用带 id 的类别（home.rewards），比 rewards.categories 的纯名称列表更可靠
  const categoryOptions = useMemo(
    () => (home.data?.rewards ?? []).map((c) => ({ label: c.label, value: c.id })),
    [home.data],
  );
  const noCategories = !home.isLoading && categoryOptions.length === 0;

  const [form] = Form.useForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RewardRecord | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["foundation", "rewards"] });
    queryClient.invalidateQueries({ queryKey: ["foundation", "home"] });
  };

  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: RewardRecordSaveRequest }) => {
      if (input.id) await updateRewardRecord(input.id, input.body);
      else await createRewardRecord(input.body);
    },
    onSuccess: (_data, input) => {
      invalidate();
      setDialogOpen(false);
      MessagePlugin.success(input.id ? "获奖记录已保存" : "获奖记录已创建");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "保存获奖记录失败")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRewardRecord(id),
    onSuccess: () => {
      invalidate();
      MessagePlugin.success("获奖记录已删除");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "删除获奖记录失败")),
  });

  const openDialog = (row: RewardRecord | null) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onConfirm = async () => {
    const valid = await form.validate();
    if (valid !== true) return;
    const v = form.getFieldsValue(true) as RecordFormValues;
    const body: RewardRecordSaveRequest = {
      // SaveRequest 外键按数字发（VO 的 id 是字符串）
      categoryId: Number(v.categoryId),
      recipient: (v.recipient ?? "").trim(),
      amount: numOrNull(v.amount),
    };
    save.mutate({ id: editing?.id ?? null, body });
  };

  const columns = [
    {
      colKey: "categoryName",
      title: "奖项类别",
      width: 200,
      ellipsis: true,
      render: ({ row }: { row: RewardRecord }) => row.categoryName || "-",
    },
    { colKey: "recipient", title: "获奖人", width: 160 },
    {
      colKey: "amount",
      title: "奖金（元）",
      width: 140,
      render: ({ row }: { row: RewardRecord }) => formatYuan(row.amount ?? null),
    },
    {
      colKey: "op",
      title: "操作",
      width: 160,
      render: ({ row }: { row: RewardRecord }) => (
        <Space size="small">
          <Button theme="primary" variant="text" size="small" onClick={() => openDialog(row)}>
            编辑
          </Button>
          <Popconfirm
            theme="danger"
            destroyOnClose
            content={`确认删除「${row.recipient}」的获奖记录？`}
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

  const loadError = rewards.isError ? describeApiError(rewards.error, "获奖记录加载失败") : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">获奖记录</h1>
          <p className="mt-1 text-sm text-gray-500">
            维护各奖项类别下的获奖人与奖金。奖金留空表示该记录不展示金额。
          </p>
        </div>
        <Button theme="primary" onClick={() => openDialog(null)} disabled={noCategories}>
          新增记录
        </Button>
      </div>

      {noCategories && (
        <Alert
          theme="warning"
          className="mb-4"
          message="尚未创建任何奖项类别，请先到「奖项类别」页新增，才能添加获奖记录。"
        />
      )}
      {loadError && <Alert theme="error" className="mb-4" message={loadError} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          data={rows}
          columns={columns}
          loading={rewards.isLoading}
          empty="暂无获奖记录"
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? `编辑获奖记录：${editing.recipient}` : "新增获奖记录"}
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
            categoryId: editing?.categoryId,
            recipient: editing?.recipient,
            amount: editing?.amount ?? undefined,
          }}
        >
          <Form.FormItem
            label="奖项类别"
            name="categoryId"
            rules={[{ required: true, message: "请选择所属奖项类别" }]}
          >
            <Select
              placeholder="请选择类别"
              options={categoryOptions}
              filterable
              style={{ width: "100%" }}
            />
          </Form.FormItem>
          <Form.FormItem
            label="获奖人"
            name="recipient"
            rules={[{ required: true, message: "请填写获奖人姓名" }]}
          >
            <Input placeholder="≤32 字" maxlength={32} clearable />
          </Form.FormItem>
          <Form.FormItem label="奖金（元）" name="amount" help="金额单位为元，选填">
            <InputNumber min={0} theme="normal" placeholder="选填" style={{ width: "100%" }} />
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}
