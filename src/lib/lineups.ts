/**
 * CS 道具点位显示字典 —— kevin 前台（csgo 浏览器页签）与管理端（/admin/lineups 表单选项）共用，
 * 避免「烟/闪/火/诱饵」文案在两处漂移。类型镜像见 lib/types.ts 的 NadeKind。
 */
import type { NadeKind } from "@/lib/types";

export const NADE_LABEL: Record<NadeKind, string> = {
  smoke: "烟",
  flash: "闪",
  molotov: "火",
  decoy: "诱饵",
};

/** 管理端 Select 选项（key 顺序即展示顺序；与后端 @Pattern 枚举一致） */
export const NADE_OPTIONS: { label: string; value: NadeKind }[] = (
  Object.keys(NADE_LABEL) as NadeKind[]
).map((k) => ({ value: k, label: `${NADE_LABEL[k]}（${k}）` }));
