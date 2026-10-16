/**
 * CS 道具点位显示字典 —— kevin 前台（csgo 浏览器页签）与管理端（/admin/lineups 表单选项）共用，
 * 避免「烟/闪/火/雷/诱饵」文案在两处漂移。类型镜像见 lib/types.ts 的 NadeKind。
 * 2026-10-16 起 kind 即中文值（不再有英文码 → 中文标签的映射层），数组顺序即展示顺序。
 */
import type { NadeKind } from "@/lib/types";

export const NADE_KINDS: NadeKind[] = ["烟", "闪", "火", "雷", "诱饵"];

/** 管理端 Select 选项（与后端 @Pattern 枚举一致） */
export const NADE_OPTIONS: { label: NadeKind; value: NadeKind }[] = NADE_KINDS.map((k) => ({
  value: k,
  label: k,
}));

/** 地图候选（2026-10-16 用户拍板的十张图；admin 表单下拉用，后端 map 列仍为自由文本 ≤32） */
export const CS_MAPS = [
  "Dust2",
  "Mirage",
  "Inferno",
  "Nuke",
  "Train",
  "Overpass",
  "Vertigo",
  "Cobblestone",
  "Cache",
  "Ancient",
] as const;

/** 管理端地图 Select 选项 */
export const MAP_OPTIONS: { label: string; value: string }[] = CS_MAPS.map((m) => ({
  value: m,
  label: m,
}));
