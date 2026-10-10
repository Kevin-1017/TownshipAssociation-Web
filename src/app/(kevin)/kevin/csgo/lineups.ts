/**
 * CS:GO / CS2 道具点位数据 —— 这是给「格式打样」的示例条目，
 * 点位描述未必实战可用，把你在游戏里实测过的投法替换进来即可；
 * 新增字段（如视频链接、截图路径）顺着 interface 加。
 */

export type NadeKind = "smoke" | "flash" | "molotov" | "decoy";

export interface Lineup {
  /** 地图名，筛选页签按去重后的 map 自动生成 */
  map: string;
  /** 归类点位名，如「警家」「香蕉道」 */
  site: string;
  kind: NadeKind;
  /** 一句话名字 */
  name: string;
  /** 投掷方式标签：站位 / 跳投 / Timing 等 */
  style: string;
  /** 分步操作：站位 → 瞄准参照 → 投掷动作 */
  steps: string[];
  /** 用途或备注 */
  note?: string;
}

export const NADE_LABEL: Record<NadeKind, string> = {
  smoke: "烟",
  flash: "闪",
  molotov: "火",
  decoy: "诱饵",
};

export const LINEUPS: Lineup[] = [
  {
    map: "Mirage",
    site: "警家",
    kind: "smoke",
    name: "T 萌新一号位警家烟（示例）",
    style: "站位",
    steps: [
      "站 T 二楼口栏杆最左侧，背贴墙",
      "平视对准对面电线杆与屋檐交界点",
      "大跳松 W 落定后原地投，抛物线过高说明参照点偏了",
    ],
    note: "示例占位：请替换成你实测稳定落进警家的站位。",
  },
  {
    map: "Mirage",
    site: "Connector",
    kind: "molotov",
    name: "哨位近道火（示例）",
    style: "跳投",
    steps: ["从 T 出口贴右墙助跑", "瞄二楼窗下沿", "出跳瞬间投，落点近道拐角"],
  },
  {
    map: "Inferno",
    site: "香蕉道",
    kind: "smoke",
    name: "CT 位香蕉道烟（示例）",
    style: "站位",
    steps: ["香蕉道 CT 侧沙堆后站位", "瞄墓园砖缝交叉点", "高抛落 CT 车头"],
    note: "示例占位，换成你自己的双封烟第一颗。",
  },
  {
    map: "Inferno",
    site: "Arch",
    kind: "flash",
    name: "拱门反清闪（示例）",
    style: "反弹",
    steps: ["退到图书馆门框", "瞄右侧门柱上沿打反弹", "爆点刚好盖住拱门缺口"],
  },
];
