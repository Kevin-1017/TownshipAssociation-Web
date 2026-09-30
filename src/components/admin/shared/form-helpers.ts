/** 管理端表单共用小工具 */

/** InputNumber/输入框清空后可能是 ''、null、undefined 或字符串数字，统一转 number|null */
export function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
