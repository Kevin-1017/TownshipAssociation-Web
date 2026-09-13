/**
 * 官网展示层格式化工具 —— 与小程序 utils/format 同口径。
 *
 * 后端时间统一为带时区 ISO 8601（如 '2026-09-06T14:30:00+08:00'）；
 * 金额单位为「元」，禁止 /100 换算。
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** '2026-09-06T14:30:00+08:00' → '2026-09-06'；解析失败时原样返回 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** '2026-09-06T14:30:00+08:00' → '2026-09-06 14:30' */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 金额（元）：50000 → '¥5万'，12500 → '¥1.3万'，3000 → '¥3000'（与小程序 formatAmount 一致） */
export function formatAmount(yuan: number): string {
  if (yuan >= 10000) {
    return `¥${(yuan / 10000).toFixed(yuan % 10000 === 0 ? 0 : 1)}万`;
  }
  return `¥${yuan}`;
}
