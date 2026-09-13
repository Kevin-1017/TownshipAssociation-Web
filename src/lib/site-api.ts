/**
 * 官网只读接口封装 —— 基于 lib/api 的 request，path 自带 /tsa 前缀。
 * 契约与后端 AnnouncementController / FoundationController 对齐：
 * 成功 code=200 解包 data；VO 的 id 为字符串；金额单位为「元」，不做换算。
 */
import { request } from "@/lib/api";
import type {
  DonationRecord,
  FoundationHome,
  Notice,
  RewardRecords,
} from "@/lib/types";

/** GET /tsa/foundation —— 首页聚合（奖励类别 + 捐赠鸣谢预览） */
export function fetchFoundationHome(): Promise<FoundationHome> {
  return request<FoundationHome>("/tsa/foundation");
}

/** GET /tsa/foundation/rewards —— 奖励明细（类别名列表 + 获奖记录） */
export function fetchRewardRecords(): Promise<RewardRecords> {
  return request<RewardRecords>("/tsa/foundation/rewards");
}

/** GET /tsa/foundation/donations —— 捐赠明细（后端已按日期倒序） */
export function fetchDonations(): Promise<DonationRecord[]> {
  return request<DonationRecord[]>("/tsa/foundation/donations");
}

/** GET /tsa/notices —— 公告列表（置顶优先、发布时间倒序，不分页） */
export function fetchNotices(): Promise<Notice[]> {
  return request<Notice[]>("/tsa/notices");
}

/** GET /tsa/notices/{id} —— 公告详情；id 为字符串形式的数字 */
export function fetchNoticeDetail(id: string): Promise<Notice> {
  return request<Notice>(`/tsa/notices/${encodeURIComponent(id)}`);
}
