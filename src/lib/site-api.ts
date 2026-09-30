/**
 * 官网接口封装 —— 基于 lib/api 的 request，path 自带 /tsa 前缀。
 * 契约与后端 AnnouncementController / FoundationController / CommunityController /
 * EventController 对齐：
 * 成功 code=200 解包 data；VO 的 id 为字符串；金额单位为「元」，不做换算。
 * 社区广场一期无登录（作者为表单昵称），读接口 + 发布/点赞/评论写接口都无需 token；
 * 事件（/tsa/events）同为公网匿名读接口。网站不受微信平台 5.7.1 UGC 限制，
 * 社区写入口照常保留。
 */
import { request } from "@/lib/api";
import type {
  CommunityComment,
  CommunityCommentSaveRequest,
  CommunityPost,
  CommunityPostSaveRequest,
  CommunityPostType,
  DonationRecord,
  EventListItem,
  FoundationHome,
  Notice,
  PageVO,
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

// ============ 乡会事件（事件线，公网匿名读） ============

/**
 * 年份筛选候选 —— 下限 2000，上限取当前年，倒序。
 * 后端以 start_time 半开区间命中 idx_start_time 索引，前端透传 ?yearFrom=&yearTo= 区间即可。
 */
export const EVENT_YEARS: number[] = Array.from(
  { length: new Date().getFullYear() - 2000 + 1 },
  (_, i) => new Date().getFullYear() - i,
);

export interface EventsQuery {
  page?: number;
  /** 后端钳制 1..50 */
  pageSize?: number;
  /** 单年过滤（4 位数字；缺省不限，越界后端返 400） */
  year?: number | null;
  /** 年份区间起（含，4 位数字）；与 yearTo 任一侧可缺省=开区间 */
  yearFrom?: number | null;
  /** 年份区间止（含）；yearFrom>yearTo 后端返 400 */
  yearTo?: number | null;
}

/** GET /tsa/events —— 事件分页（后端按 start_time 倒序；VO 无正文，status 派生） */
export function fetchEvents(query: EventsQuery = {}): Promise<PageVO<EventListItem>> {
  const sp = new URLSearchParams();
  sp.set("page", String(query.page ?? 1));
  sp.set("pageSize", String(query.pageSize ?? 10));
  if (query.year) sp.set("year", String(query.year));
  if (query.yearFrom) sp.set("yearFrom", String(query.yearFrom));
  if (query.yearTo) sp.set("yearTo", String(query.yearTo));
  return request<PageVO<EventListItem>>(`/tsa/events?${sp.toString()}`);
}

// 事件详情（GET /tsa/events/{id}）web 端不使用：列表直跳公众号，无详情页。

// ============ 社区动态（广场） ============

/** 菜系候选（后端字典就位后可换拉取） */
export const CUISINE_OPTIONS = [
  "潮汕菜",
  "粤菜",
  "客家菜",
  "川菜",
  "湘菜",
  "西北菜",
  "日韩料理",
  "西餐",
];

/** 地区候选（接口传 value，展示用 label） */
export const COMMUNITY_REGIONS: { label: string; value: string }[] = [
  { label: "龙洞", value: "longdong" },
  { label: "大学城", value: "daxuecheng" },
];

/** 地区 code → 中文名；未登记值原样展示 */
export function regionLabel(region: string | null | undefined): string {
  if (!region) return "";
  return COMMUNITY_REGIONS.find((r) => r.value === region)?.label ?? region;
}

export interface CommunityPostsQuery {
  page?: number;
  pageSize?: number;
  /** 分栏主筛选：food / campus，缺省不限 */
  type?: CommunityPostType | null;
  /** 菜系（仅美食栏传） */
  cuisine?: string | null;
  /** 地区 code（仅美食栏传） */
  region?: string | null;
  /** 关键字：模糊匹配标题/正文 */
  keyword?: string | null;
}

/** GET /tsa/community/posts —— 动态分页（后端按发布时间倒序） */
export function fetchCommunityPosts(
  query: CommunityPostsQuery = {},
): Promise<PageVO<CommunityPost>> {
  const sp = new URLSearchParams();
  sp.set("page", String(query.page ?? 1));
  sp.set("pageSize", String(query.pageSize ?? 10));
  if (query.type) sp.set("type", query.type);
  if (query.cuisine) sp.set("cuisine", query.cuisine);
  if (query.region) sp.set("region", query.region);
  if (query.keyword) sp.set("keyword", query.keyword);
  return request<PageVO<CommunityPost>>(`/tsa/community/posts?${sp.toString()}`);
}

/** GET /tsa/community/posts/{id} —— 动态详情（含 commentsList） */
export function fetchCommunityPostDetail(id: string): Promise<CommunityPost> {
  return request<CommunityPost>(`/tsa/community/posts/${encodeURIComponent(id)}`);
}

/** POST /tsa/community/posts —— 发布动态，返回新动态 id（字符串） */
export function publishCommunityPost(body: CommunityPostSaveRequest): Promise<string> {
  return request<string>("/tsa/community/posts", { method: "POST", body });
}

/** POST /tsa/community/posts/{id}/like —— 点赞计数 +1，返回点赞后的总数 */
export function likeCommunityPost(id: string): Promise<number> {
  return request<number>(`/tsa/community/posts/${encodeURIComponent(id)}/like`, {
    method: "POST",
  });
}

/** POST /tsa/community/posts/{id}/comments —— 发表评论，返回新建评论 */
export function commentCommunityPost(
  id: string,
  body: CommunityCommentSaveRequest,
): Promise<CommunityComment> {
  return request<CommunityComment>(
    `/tsa/community/posts/${encodeURIComponent(id)}/comments`,
    { method: "POST", body },
  );
}
