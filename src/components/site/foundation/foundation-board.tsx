"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AmountText, PageHead, ThanksBadge } from "@/components/site/shared/parts";
import { EmptyHint, ErrorHint, ListSkeleton } from "@/components/site/shared/state-blocks";
import { useAsyncData } from "@/components/site/shared/use-async-data";
import { fetchDonations, fetchRewardRecords } from "@/lib/site-api";
import { formatDate } from "@/lib/site-format";
import type { RewardRecord } from "@/lib/types";
import "./foundation-board.css";

/**
 * 校友基金会页：两个 tab —— 校内奖励与表彰（按类别分组）、捐赠与帮助致谢（按日期倒序）。
 * 金额单位「元」；捐赠 amount 为 null 表示保密，显示「鸣谢」徽标不显示数字。
 * 初始 tab 由 ?tab=donations|rewards 深链决定（首页速览卡「明细」直达对应板块），
 * 非法值回退 rewards；静态导出下 useSearchParams 必须包 Suspense（页面层已包）。
 */

type TabKey = "rewards" | "donations";

/** 按后端 categories 顺序分组获奖记录；类别缺失或未登记的记录兜底归入「其他」 */
function groupRewards(
  categories: string[],
  records: RewardRecord[],
): { category: string; records: RewardRecord[] }[] {
  const groups: { category: string; records: RewardRecord[] }[] = categories.map((c) => ({
    category: c,
    records: [] as RewardRecord[],
  }));
  const index = new Map(groups.map((g) => [g.category, g]));
  for (const r of records) {
    const name = r.categoryName && index.has(r.categoryName) ? r.categoryName : null;
    if (name) {
      index.get(name)!.records.push(r);
      continue;
    }
    const fallbackName = r.categoryName?.trim() || "其他";
    let group = index.get(fallbackName);
    if (!group) {
      group = { category: fallbackName, records: [] };
      index.set(fallbackName, group);
      groups.push(group);
    }
    group.records.push(r);
  }
  return groups.filter((g) => g.records.length > 0);
}

export default function FoundationBoard() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() =>
    searchParams.get("tab") === "donations" ? "donations" : "rewards",
  );
  const rewards = useAsyncData(fetchRewardRecords);
  const donations = useAsyncData(
    async () =>
      (await fetchDonations()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
  );

  const groups = useMemo(
    () => groupRewards(rewards.state.data?.categories ?? [], rewards.state.data?.records ?? []),
    [rewards.state.data],
  );

  return (
    <div>
      <PageHead title="校友基金会" subtitle="奖教助学，爱心同行 —— 奖励与捐赠信息全部公开可查" />

      <div className="site-container pt-6 sm:pt-8">
        <div className="site-tabs" role="tablist" aria-label="基金会内容分类">
          {(
            [
              { key: "rewards" as const, label: "校内奖励与表彰" },
              { key: "donations" as const, label: "捐赠与帮助致谢" },
            ]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`foundation-tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`foundation-panel-${t.key}`}
              className={`site-tab${tab === t.key ? " site-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---------- 奖励面板 ---------- */}
        <section
          role="tabpanel"
          id="foundation-panel-rewards"
          aria-labelledby="foundation-tab-rewards"
          hidden={tab !== "rewards"}
          className="pt-5 sm:pt-6"
        >
          {rewards.state.status === "loading" ? <ListSkeleton rows={4} /> : null}
          {rewards.state.status === "error" ? (
            <ErrorHint message={rewards.state.error} onRetry={rewards.reload} />
          ) : null}
          {rewards.state.status === "ready" && groups.length === 0 ? (
            <EmptyHint text="暂无奖励与表彰记录，请稍后再来查看。" />
          ) : null}
          {rewards.state.status === "ready" && groups.length > 0 ? (
            <div className="space-y-8">
              {groups.map((g) => (
                <div key={g.category}>
                  <div className="mb-2 flex items-baseline gap-2.5">
                    <h2 className="site-display text-lg font-bold">{g.category}</h2>
                    <span className="t-sub text-xs tabular-nums">{g.records.length} 条</span>
                  </div>
                  <ul className="site-card site-divide overflow-hidden">
                    {g.records.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-baseline justify-between gap-4 px-5 py-3.5 sm:px-6"
                      >
                        <span className="min-w-0 truncate font-medium">{r.recipient}</span>
                        <AmountText amount={r.amount} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="t-sub text-xs">
                * 部分奖项未公布单项奖金金额；奖金类别与金额以乡会理事会公布为准。
              </p>
            </div>
          ) : null}
        </section>

        {/* ---------- 捐赠面板 ---------- */}
        <section
          role="tabpanel"
          id="foundation-panel-donations"
          aria-labelledby="foundation-tab-donations"
          hidden={tab !== "donations"}
          className="pt-5 sm:pt-6"
        >
          {donations.state.status === "loading" ? <ListSkeleton rows={5} /> : null}
          {donations.state.status === "error" ? (
            <ErrorHint message={donations.state.error} onRetry={donations.reload} />
          ) : null}
          {donations.state.status === "ready" && (donations.state.data?.length ?? 0) === 0 ? (
            <EmptyHint text="暂无捐赠鸣谢记录，请稍后再来查看。" />
          ) : null}
          {donations.state.status === "ready" && (donations.state.data?.length ?? 0) > 0 ? (
            <>
              <ul className="site-card site-divide overflow-hidden">
                {donations.state.data!.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-baseline justify-between gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.donorName}</p>
                      <p className="t-sub mt-0.5 text-xs tabular-nums">
                        捐赠日期 · {formatDate(d.date)}
                      </p>
                    </div>
                    {d.amount == null ? <ThanksBadge /> : <AmountText amount={d.amount} />}
                  </li>
                ))}
              </ul>
              <p className="t-sub mt-3 text-xs">
                * 应捐赠人意愿，部分记录不公开具体金额，谨此一并致谢（标「鸣谢」者即为金额保密）。
              </p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
