/**
 * 管理后台 API 封装：在 lib/api.ts 的 request 之上补齐 token 注入、业务码中文化与 401 判定。
 *
 * 契约口径（与后端并行实现约定，勿随意改动）：
 * - POST /tsa/auth/admin-login → AdminLoginVO；1307=用户名或密码错误、1306=限频。
 * - 基金会/公告管理写接口挂 /tsa/admin/**（SaToken admin 角色），401 表示未登录/过期。
 * - 管理端列表数据复用公开读接口：GET /tsa/foundation（首页聚合，类别含 id/名称/金额/赞助人）、
 *   GET /tsa/foundation/rewards（获奖记录 + 类别名列表）、GET /tsa/foundation/donations（捐赠，保密笔 amount=null）。
 * - VO 的 id 是字符串；SaveRequest 的外键 id 按数字发。金额单位元，不做 /100 换算。
 * - 日期请求字段按后端 @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")，形如 2026-08-10T00:00:00+08:00。
 */
import { ApiError, request, uploadImage } from "@/lib/api";
import { getAdminToken } from "@/lib/admin-auth";
import type {
  AdminLoginVO,
  CommunityComment,
  CommunityPost,
  DonationRecord,
  DonationSaveRequest,
  DonationAdminRecord,
  EventListItem,
  FoundationHome,
  Notice,
  NoticeSaveRequest,
  PageVO,
  RewardCategorySaveRequest,
  RewardRecords,
  RewardRecordSaveRequest,
} from "@/lib/types";

/** GET /tsa/admin/auth/me 出参（AdminCurrentUserVO；role：1 超级管理员 / 2 普通管理员） */
export interface AdminMe {
  username: string;
  role: number;
}

function token(): string | null {
  return getAdminToken();
}

// ============ 登录态 ============

export function adminLogin(username: string, password: string): Promise<AdminLoginVO> {
  return request<AdminLoginVO>("/tsa/auth/admin-login", { method: "POST", body: { username, password } });
}

/** 幂等接口：即使 token 已失效也应调用（本地清理由调用方兜底） */
export function adminLogout(): Promise<void> {
  return request<void>("/tsa/auth/admin-logout", { method: "POST", token: token() });
}

export function adminMe(): Promise<AdminMe> {
  return request<AdminMe>("/tsa/admin/auth/me", { token: token() });
}

// ============ 管理端列表数据源（公开读，无需 token） ============

export function fetchFoundationHome(): Promise<FoundationHome> {
  return request<FoundationHome>("/tsa/foundation");
}

export function fetchRewardRecords(): Promise<RewardRecords> {
  return request<RewardRecords>("/tsa/foundation/rewards");
}

export function fetchDonationRecords(): Promise<DonationRecord[]> {
  return request<DonationRecord[]>("/tsa/foundation/donations");
}

// ============ 管理端读（需 admin token） ============

/** GET /tsa/admin/foundation/donations —— 管理端捐赠明细：amount 为原值（保密只作用于官网展示） */
export function fetchAdminDonations(): Promise<DonationAdminRecord[]> {
  return request<DonationAdminRecord[]>("/tsa/admin/foundation/donations", { token: token() });
}

// ============ 基金会管理写接口 ============

export function createRewardCategory(body: RewardCategorySaveRequest): Promise<string> {
  return request<string>("/tsa/admin/foundation/categories", { method: "POST", body, token: token() });
}

export function updateRewardCategory(id: string, body: RewardCategorySaveRequest): Promise<void> {
  return request<void>(`/tsa/admin/foundation/categories/${id}`, { method: "PUT", body, token: token() });
}

/** 后端连带删除该类别下的获奖记录 */
export function deleteRewardCategory(id: string): Promise<void> {
  return request<void>(`/tsa/admin/foundation/categories/${id}`, { method: "DELETE", token: token() });
}

export function createRewardRecord(body: RewardRecordSaveRequest): Promise<string> {
  return request<string>("/tsa/admin/foundation/records", { method: "POST", body, token: token() });
}

export function updateRewardRecord(id: string, body: RewardRecordSaveRequest): Promise<void> {
  return request<void>(`/tsa/admin/foundation/records/${id}`, { method: "PUT", body, token: token() });
}

export function deleteRewardRecord(id: string): Promise<void> {
  return request<void>(`/tsa/admin/foundation/records/${id}`, { method: "DELETE", token: token() });
}

export function createDonation(body: DonationSaveRequest): Promise<string> {
  return request<string>("/tsa/admin/foundation/donations", { method: "POST", body, token: token() });
}

export function updateDonation(id: string, body: DonationSaveRequest): Promise<void> {
  return request<void>(`/tsa/admin/foundation/donations/${id}`, { method: "PUT", body, token: token() });
}

export function deleteDonation(id: string): Promise<void> {
  return request<void>(`/tsa/admin/foundation/donations/${id}`, { method: "DELETE", token: token() });
}

// ============ 公告管理 ============

/** 置顶优先、发布时间倒序，不分页一次给全 */
export function fetchAdminNotices(): Promise<Notice[]> {
  return request<Notice[]>("/tsa/admin/notices", { token: token() });
}

export function createNotice(body: NoticeSaveRequest): Promise<string> {
  return request<string>("/tsa/admin/notices", { method: "POST", body, token: token() });
}

/** id 走路径参数，请求体不带 id（后端 NoticeSaveRequest 无 id 字段） */
export function updateNotice(id: string, body: NoticeSaveRequest): Promise<void> {
  return request<void>(`/tsa/admin/notices/${id}`, { method: "PUT", body, token: token() });
}

export function deleteNotice(id: string): Promise<void> {
  return request<void>(`/tsa/admin/notices/${id}`, { method: "DELETE", token: token() });
}

// ============ 社区动态审核 ============

/** GET /tsa/admin/community/posts —— 服务端分页；status：0 待审/1 已过/2 已驳，缺省全部 */
export function fetchAdminCommunityPosts(query: {
  page?: number;
  pageSize?: number;
  status?: number | null;
  type?: string | null;
}): Promise<PageVO<CommunityPost>> {
  const sp = new URLSearchParams();
  sp.set("page", String(query.page ?? 1));
  sp.set("pageSize", String(query.pageSize ?? 10));
  if (query.status != null) sp.set("status", String(query.status));
  if (query.type) sp.set("type", query.type);
  return request<PageVO<CommunityPost>>(`/tsa/admin/community/posts?${sp.toString()}`, {
    token: token(),
  });
}

/** PUT /tsa/admin/community/posts/{id}/audit —— status：1 通过 / 2 驳回（驳回可恢复） */
export function auditCommunityPost(id: string, status: number): Promise<void> {
  return request<void>(`/tsa/admin/community/posts/${id}/audit`, {
    method: "PUT",
    body: { status },
    token: token(),
  });
}

/** GET /tsa/admin/community/comments —— 评论管理端分页；postId 可选只看某动态下评论；type 按所属动态栏目过滤 */
export function fetchAdminComments(query: {
  page?: number;
  pageSize?: number;
  status?: number | null;
  postId?: string | null;
  type?: string | null;
} = {}): Promise<PageVO<CommunityComment>> {
  const sp = new URLSearchParams();
  sp.set("page", String(query.page ?? 1));
  sp.set("pageSize", String(query.pageSize ?? 10));
  if (query.status != null) sp.set("status", String(query.status));
  if (query.postId) sp.set("postId", query.postId);
  if (query.type) sp.set("type", query.type);
  return request<PageVO<CommunityComment>>(`/tsa/admin/community/comments?${sp.toString()}`, {
    token: token(),
  });
}

/** PUT /tsa/admin/community/comments/{id}/audit —— status：1 通过 / 2 驳回（驳回可恢复） */
export function auditComment(id: string, status: number): Promise<void> {
  return request<void>(`/tsa/admin/community/comments/${id}/audit`, {
    method: "PUT",
    body: { status },
    token: token(),
  });
}

// ============ 乡会事件管理（删除即下架） ============
/** GET /tsa/admin/events —— 服务端分页；keyword 标题模糊；start_time 倒序；出参复用公开列表 VO */
export function fetchAdminEvents(query: {
  page?: number;
  pageSize?: number;
  keyword?: string | null;
} = {}): Promise<PageVO<EventListItem>> {
  const sp = new URLSearchParams();
  sp.set("page", String(query.page ?? 1));
  sp.set("pageSize", String(query.pageSize ?? 10));
  if (query.keyword) sp.set("keyword", query.keyword);
  return request<PageVO<EventListItem>>(`/tsa/admin/events?${sp.toString()}`, { token: token() });
}

/** 事件表单 → 后端 EventSaveRequest：cover 是上传回来的相对路径；日期走 +08:00 口径 */
export interface EventSavePayload {
  title: string;
  cover: string | null;
  summary: string | null;
  articleUrl: string | null;
  startTime: string;
}

export function createEvent(body: EventSavePayload): Promise<string> {
  return request<string>("/tsa/admin/events", { method: "POST", body, token: token() });
}

export function updateEvent(id: string, body: EventSavePayload): Promise<void> {
  return request<void>(`/tsa/admin/events/${id}`, { method: "PUT", body, token: token() });
}

export function deleteEvent(id: string): Promise<void> {
  return request<void>(`/tsa/admin/events/${id}`, { method: "DELETE", token: token() });
}

/** 事件封面上传：admin 令牌走 /tsa/admin/events/cover（微信 Bearer 的 /tsa/files 与后台无关） */
export async function uploadEventCover(file: File): Promise<string> {
  const r = await uploadImage("/tsa/admin/events/cover", file, token());
  return r.path;
}

// ============ 错误与日期/金额展示辅助 ============

/**
 * 未登录/登录过期判定：业务 code 401，或 HTTP 层 401
 * （request() 把非 2xx 统一包成 ApiError(-1, "HTTP 401 ...")）。
 */
export function isUnauthorizedError(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  return e.code === 401 || (e.code === -1 && /\bHTTP 401\b/.test(e.message));
}

/** 通用报错文案：优先展示后端 message，网络层错误给专门提示 */
export function describeApiError(e: unknown, fallback = "操作失败，请稍后再试"): string {
  if (e instanceof ApiError) {
    if (e.code === -1) return e.message || "网络异常，请确认后端服务已启动";
    return e.message || fallback;
  }
  return fallback;
}

/** 登录页专用：业务码中文化 */
export function describeLoginError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 1307) return "用户名或密码错误";
    if (e.code === 1306) return "尝试太频繁，稍后再试";
    if (isUnauthorizedError(e)) return "登录状态无效，请重试";
    return e.message || "登录失败，请稍后再试";
  }
  return "登录失败，请稍后再试";
}

/** DatePicker（YYYY-MM-DD）→ 后端请求字段（ISO 8601 带时区，取当天零点东八区） */
export function pickerDateToApi(v: string): string {
  return `${v}T00:00:00+08:00`;
}

/** DatePicker 响应回填：ISO 8601（带或不带时区均兼容）→ YYYY-MM-DD；入参为空返回空串（兜底缺值数据，避免整页白屏） */
export function apiToPickerDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** ISO 8601 → 'YYYY-MM-DD HH:mm:ss'（DateTimePicker 回填 / 表格展示兜底；缺时间部分按 00:00:00 补齐；入参为空返回空串） */
export function apiToPickerDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const normalized = iso.replace(" ", "T");
  const date = normalized.slice(0, 10);
  const parts = normalized.slice(11, 19).split(":");
  const pad = (i: number) => (parts[i] || "00").padStart(2, "0");
  return `${date} ${pad(0)}:${pad(1)}:${pad(2)}`;
}

/** 'YYYY-MM-DD HH:mm:ss'（DatePicker enableTimePicker 的 valueType 格式）→ ISO 8601 带时区 */
export function pickerDateTimeToApi(v: string): string {
  return `${v.replace(" ", "T")}+08:00`;
}

/** 表格展示：'YYYY-MM-DD HH:mm' */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return apiToPickerDateTime(iso).slice(0, 16);
}

/** 金额展示：单位元，千分位 */
export function formatYuan(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("zh-CN");
}
