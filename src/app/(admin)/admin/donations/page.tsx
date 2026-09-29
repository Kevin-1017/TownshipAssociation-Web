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
  InputNumber,
  MessagePlugin,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
} from "tdesign-react";
import {
  apiToPickerDate,
  createDonation,
  deleteDonation,
  describeApiError,
  fetchAdminDonations,
  formatYuan,
  pickerDateToApi,
  updateDonation,
} from "@/lib/admin-api";
import type { DonationAdminRecord, DonationSaveRequest } from "@/lib/types";
import { numOrNull } from "@/components/admin/form-helpers";

type DonationFormValues = {
  donorName?: string;
  amount?: number | string | null;
  amountVisible?: boolean;
  donationDate?: string;
};

/**
 * 捐赠鸣谢管理：数据源 GET /tsa/admin/foundation/donations（amount 原值——保密只是官网展示口径）。
 * 表单含「金额是否公开」开关：关闭后官网只显示鸣谢、不显示数字；后台表格始终显示真实金额。
 */
export default function AdminDonationsPage() {
  const queryClient = useQueryClient();
  const donations = useQuery({
    queryKey: ["admin", "donations"],
    queryFn: fetchAdminDonations,
  });
  const rows = useMemo<DonationAdminRecord[]>(() => donations.data ?? [], [donations.data]);

  const [form] = Form.useForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DonationAdminRecord | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "donations"] });
    queryClient.invalidateQueries({ queryKey: ["foundation", "donations"] });
    queryClient.invalidateQueries({ queryKey: ["foundation", "home"] });
  };

  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: DonationSaveRequest }) => {
      if (input.id) await updateDonation(input.id, input.body);
      else await createDonation(input.body);
    },
    onSuccess: (_data, input) => {
      invalidate();
      setDialogOpen(false);
      MessagePlugin.success(input.id ? "捐赠记录已保存" : "捐赠记录已创建");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "保存捐赠记录失败")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDonation(id),
    onSuccess: () => {
      invalidate();
      MessagePlugin.success("捐赠记录已删除");
    },
    onError: (e) => MessagePlugin.error(describeApiError(e, "删除捐赠记录失败")),
  });

  const openDialog = (row: DonationAdminRecord | null) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onConfirm = async () => {
    const valid = await form.validate();
    if (valid !== true) return;
    const v = form.getFieldsValue(true) as DonationFormValues;
    const amount = numOrNull(v.amount);
    const body: DonationSaveRequest = {
      donorName: (v.donorName ?? "").trim(),
      amount: amount ?? 0,
      amountVisible: v.amountVisible === true,
      donationDate: pickerDateToApi(v.donationDate ?? ""),
    };
    save.mutate({ id: editing?.id ?? null, body });
  };

  const columns = [
    { colKey: "donorName", title: "捐赠人", width: 200 },
    {
      colKey: "amount",
      title: "金额（元）",
      width: 220,
      // 管理端显示原值；保密笔仅加「官网不公开」小标提示展示口径
      cell: ({ row }: { row: DonationAdminRecord }) => (
        <Space size="small">
          <span>{row.amount === null || row.amount === undefined ? "-" : formatYuan(row.amount)}</span>
          {row.amountVisible === false && (
            <Tag theme="default" variant="light" size="small">
              官网不公开
            </Tag>
          )}
        </Space>
      ),
    },
    {
      colKey: "date",
      title: "捐赠日期",
      width: 140,
      cell: ({ row }: { row: DonationAdminRecord }) => apiToPickerDate(row.date) || "-",
    },
    {
      colKey: "op",
      title: "操作",
      width: 160,
      cell: ({ row }: { row: DonationAdminRecord }) => (
        <Space size="small">
          <Button theme="primary" variant="text" size="small" onClick={() => openDialog(row)}>
            编辑
          </Button>
          <Popconfirm
            theme="danger"
            destroyOnClose
            content={`确认删除「${row.donorName}」的捐赠记录？`}
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

  const loadError = donations.isError
    ? describeApiError(donations.error, "捐赠数据加载失败")
    : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">捐赠鸣谢</h1>
          <p className="mt-1 text-sm text-gray-500">
            维护基金会的捐赠鸣谢名单，官网按捐赠日期倒序展示。
          </p>
        </div>
        <Button theme="primary" onClick={() => openDialog(null)}>
          新增捐赠
        </Button>
      </div>

      {loadError && <Alert theme="error" className="mb-4" message={loadError} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table
          rowKey="id"
          data={rows}
          columns={columns}
          loading={donations.isLoading}
          empty="暂无捐赠记录"
        />
      </div>

      <Dialog
        visible={dialogOpen}
        header={editing ? `编辑捐赠：${editing.donorName}` : "新增捐赠鸣谢"}
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
            donorName: editing?.donorName,
            amount: editing?.amount ?? undefined,
            // 编辑时直接用接口的 amountVisible 字段（管理端读接口回原值，不再靠 amount 是否为 null 反推）
            amountVisible: editing ? editing.amountVisible === true : true,
            donationDate: editing ? apiToPickerDate(editing.date) : undefined,
          }}
        >
          <Form.FormItem
            label="捐赠人姓名"
            name="donorName"
            rules={[{ required: true, message: "请填写捐赠人姓名" }]}
          >
            <Input placeholder="≤64 字" maxlength={64} clearable />
          </Form.FormItem>
          <Form.FormItem
            label="捐赠金额（元）"
            name="amount"
            rules={[{ required: true, message: "请填写捐赠金额（元）" }]}
            help="金额单位为元，不做换算；保密只影响官网展示，后台始终可见原值"
          >
            <InputNumber min={0} theme="normal" placeholder="如：2000000" style={{ width: "100%" }} />
          </Form.FormItem>
          <Form.FormItem
            label="金额是否公开"
            name="amountVisible"
            help="关闭后官网只显示鸣谢、不显示数字"
          >
            <Switch label={["公开", "保密"]} />
          </Form.FormItem>
          <Form.FormItem
            label="捐赠日期"
            name="donationDate"
            rules={[{ required: true, message: "请选择捐赠日期" }]}
          >
            <DatePicker valueType="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.FormItem>
        </Form>
      </Dialog>
    </div>
  );
}
