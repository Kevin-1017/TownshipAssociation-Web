"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  adminMe,
  fetchAdminNotices,
  fetchDonationRecords,
  fetchFoundationHome,
  fetchRewardRecords,
} from "@/lib/admin-api";

/**
 * 工作台：四个统计卡直接复用各列表接口的现成结果计数（与列表页共享同一 queryKey 缓存）。
 */
export default function AdminDashboardPage() {
  const home = useQuery({ queryKey: ["foundation", "home"], queryFn: fetchFoundationHome });
  const rewards = useQuery({ queryKey: ["foundation", "rewards"], queryFn: fetchRewardRecords });
  const donations = useQuery({ queryKey: ["foundation", "donations"], queryFn: fetchDonationRecords });
  const notices = useQuery({ queryKey: ["admin", "notices"], queryFn: fetchAdminNotices });
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: adminMe, retry: 0 });

  const cards = [
    {
      title: "奖项类别",
      value: home.data?.rewards.length,
      hint: "基金会设置的奖励类别数",
      to: "/admin/categories",
      toLabel: "管理类别",
    },
    {
      title: "获奖记录",
      value: rewards.data?.records.length,
      hint: "全部类别下的获奖条目数",
      to: "/admin/records",
      toLabel: "管理记录",
    },
    {
      title: "捐赠笔数",
      value: donations.data?.length,
      hint: "含金额保密的捐赠",
      to: "/admin/donations",
      toLabel: "管理捐赠",
    },
    {
      title: "公告总数",
      value: notices.data?.length,
      hint: "官网展示的全部公告",
      to: "/admin/notices",
      toLabel: "管理公告",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">工作台</h1>
        <p className="mt-1 text-sm text-gray-500">
          你好，{me.data?.username ?? "管理员"}。以下为各内容模块的总量概览。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const loading = c.value === undefined;
          return (
            <div
              key={c.title}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm text-gray-500">{c.title}</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">
                {loading ? "—" : c.value}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>{c.hint}</span>
                <Link href={c.to} className="text-blue-600 hover:underline">
                  {c.toLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
