/**
 * 官网展示层格式化工具。
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

/** '2026-09-06T14:30:00+08:00' → '09-06 14:30' */
export function formatMonthDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 距今多久：<1h 分钟、<24h 小时、<30 天天数、更早显示日期 */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  if (diff < 0) return formatMonthDay(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return formatDate(iso);
}

/** 金额（元）：50000 → '¥5万'，12500 → '¥1.3万'，3000 → '¥3000' */
export function formatAmount(yuan: number): string {
  if (yuan >= 10000) {
    return `¥${(yuan / 10000).toFixed(yuan % 10000 === 0 ? 0 : 1)}万`;
  }
  return `¥${yuan}`;
}
