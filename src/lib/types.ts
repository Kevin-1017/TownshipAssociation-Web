// 与后端 com.tsa.api.common.Result 对应的统一响应包装
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

// ============ 基金会（tsa-api Foundation* 契约） ============
// 注意：金额单位一律「元」，前端不做 /100 换算。
// 后端 Long 型 id 均带 @JsonSerialize(ToStringSerializer)，序列化为【字符串】；
// 但管理端 SaveRequest 的 id/外键字段是 Java Long，请求体按【数字】发送（Jackson 两种都收）。
// LocalDateTime 统一序列化为带时区 ISO 8601 字符串（yyyy-MM-dd'T'HH:mm:ssXXX）。

/** 基金会首页奖励条目（RewardItemVO） */
export interface RewardItem {
  id: string;
  /** 奖项名称标签 */
  label: string;
  /** 金额（元） */
  amount: number | null;
  /** 赞助人/捐赠方 */
  sponsor: string | null;
}

/** 基金会首页捐赠条目（DonationItemVO） */
export interface DonationItem {
  id: string;
  donorName: string;
  /** 捐赠金额（元）；保密时为 null */
  amount: number | null;
  /** 捐赠日期（ISO 8601 带时区） */
  date: string;
}

/** 基金会首页聚合出参（FoundationHomeVO） */
export interface FoundationHome {
  rewards: RewardItem[];
  donations: DonationItem[];
}

/** 获奖记录（RewardRecordVO；后端 @JsonInclude(NON_NULL)，可空字段可能整体缺省） */
export interface RewardRecord {
  id: string;
  categoryId: string;
  categoryName?: string | null;
  recipient: string;
  /** 奖金（元），可缺省 */
  amount?: number | null;
}

/** 奖励明细出参（RewardRecordsVO） */
export interface RewardRecords {
  /** 类别名称列表（去重，供分组/筛选） */
  categories: string[];
  records: RewardRecord[];
}

/** 捐赠记录（DonationRecordVO） */
export interface DonationRecord {
  id: string;
  donorName: string;
  /** 捐赠金额（元）；保密时为 null */
  amount: number | null;
  /** 捐赠日期（ISO 8601 带时区） */
  date: string;
}

// ============ 管理端 Save 请求（字段镜像后端 DTO） ============

/** 奖项类别保存请求（RewardCategorySaveRequest） */
export interface RewardCategorySaveRequest {
  /** 奖项类别名，必填，≤64 字 */
  name: string;
  /** 赞助人/捐赠方，≤64 字 */
  sponsor?: string | null;
  /** 类别奖金总额（元） */
  amount?: number | null;
  /** 展示顺序，越小越前 */
  sort?: number | null;
}

/** 获奖记录保存请求（RewardRecordSaveRequest） */
export interface RewardRecordSaveRequest {
  /** 所属奖项类别 id（必填；从列表拿到的 id 是字符串，提交前转数字） */
  categoryId: number;
  /** 获奖人姓名，必填，≤32 字 */
  recipient: string;
  /** 奖金（元） */
  amount?: number | null;
}

/** 捐赠记录保存请求（DonationSaveRequest） */
export interface DonationSaveRequest {
  /** 捐赠人姓名，必填，≤64 字 */
  donorName: string;
  /** 捐赠金额（元），必填、≥0 */
  amount: number;
  /** 金额是否公开显示（缺省 false = 保密） */
  amountVisible?: boolean | null;
  /** 捐赠日期（ISO 8601 带时区），必填 */
  donationDate: string;
}

// ============ 公告 ============

/** 公告（NoticeVO，列表与详情共用） */
export interface Notice {
  id: string;
  title: string;
  /** 列表摘要，可空（NoticeSaveRequest.summary 非必填，后端原样落库/回显） */
  summary: string | null;
  /** 正文（纯文本含换行） */
  content: string;
  pinned: boolean;
  /** 发布时间（ISO 8601 带时区） */
  publishedAt: string;
}

/**
 * 公告保存请求 —— 与后端 NoticeSaveRequest 对齐：
 * 不含 id（新增走 POST /tsa/admin/notices，修改走 PUT /tsa/admin/notices/{id} 路径参数）；
 * 无 status 字段（公告无上下架状态，置顶+发布时间表达）；
 * publishedAt 新增不传=当前时间、修改不传=保留原发布时间。
 */
export interface NoticeSaveRequest {
  /** 标题，必填，≤64 字 */
  title: string;
  /** 列表摘要，选填，≤200 字 */
  summary?: string | null;
  /** 正文（纯文本含换行），必填 */
  content: string;
  /** 是否置顶，缺省不传=false（仅显式 true 才置顶） */
  pinned?: boolean | null;
  /** 发布时间（ISO 8601 带时区），可空 */
  publishedAt?: string | null;
}

// ============ 乡会事件（事件线：EventController） ============

/** 事件状态（后端按 Asia/Shanghai 此刻派生，不落库；库表 status 列不参与列表过滤） */
export type EventStatus = "upcoming" | "past";

/**
 * 事件列表项（EventListVO）。
 * 注意：该 VO 无 @JsonInclude(NON_NULL)，可空字段的键恒在、值为 null —— 故写 `T | null` 而非可选。
 * articleUrl 是 2026-09-14 契约 C5 增补（web 删详情页后列表直跳公众号）：
 * 后端未部署前线上响应没有该键，消费处一律按 `?? null` 容错。
 */
export interface EventListItem {
  id: string;
  title: string;
  /** 封面图 URL，可空 */
  cover: string | null;
  /** 摘要，可空 */
  summary: string | null;
  /** 公众号原文链接，可空/可能缺键（旧后端未下发） */
  articleUrl: string | null;
  /** 开始时间（ISO 8601 带时区；列表由后端按此列倒序） */
  startTime: string;
  status: EventStatus;
}

// ============ 社区动态（广场：美食基地 / 校园广场） ============

/** 动态类型（后端 CommunityPostVO.type 口径） */
export type CommunityPostType = "food" | "campus";

/** 评论（CommentVO；类上 NON_NULL，null 字段整体缺省，故均可选） */
export interface CommunityComment {
  id: string;
  author: string;
  avatar?: string | null;
  content: string;
  /** 评论时间（ISO 8601 带时区） */
  createTime: string;
  likes?: number | null;
  /** 所属动态 id（2026-09-15 起后端随列表下发） */
  postId?: string | null;
  /** 审核状态（管理端消费：0 待审/1 已过/2 已驳；公开详情的评论恒为 1） */
  status?: number | null;
}

/**
 * 社区动态（CommunityPostVO，列表与详情共用）：
 * commentsList 仅详情返回；cuisine/region 仅美食动态有值（后端 NON_NULL 省略 null）。
 */
export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  /** 发布者昵称（一期无登录，表单自由填写） */
  author: string;
  avatar?: string | null;
  title: string;
  content: string;
  /** 图片 URL 数组（后端保证非 null，无图时为空数组） */
  images: string[];
  /** 发布时间（ISO 8601 带时区） */
  publishTime: string;
  likes: number;
  /** 评论条数（后端派生） */
  comments: number;
  /** 审核状态（2026-09-14 审核制）：0 待审 / 1 已过 / 2 已驳。公开列表只会下发 1，管理端消费 */
  status?: number | null;
  commentsList?: CommunityComment[] | null;
  /** 菜系（仅美食动态） */
  cuisine?: string | null;
  /** 所在地区（仅美食动态；longdong / daxuecheng） */
  region?: string | null;
}

/** 发布动态请求（CommunityPostSaveRequest；校验：标题 5~30 字、内容 10~1000 字） */
export interface CommunityPostSaveRequest {
  type: CommunityPostType;
  author: string;
  avatar?: string | null;
  title: string;
  content: string;
  images?: string[];
  cuisine?: string | null;
  region?: string | null;
}

/** 发表评论请求（CommentSaveRequest；内容 ≤500 字） */
export interface CommunityCommentSaveRequest {
  author: string;
  avatar?: string | null;
  content: string;
}

// ============ 管理端登录 ============

/** 管理端登录出参（AdminLoginVO；role 后端为 Integer：1 超级管理员 / 2 普通管理员） */
export interface AdminLoginVO {
  token: string;
  username: string;
  role: number;
}

// ============ 通用分页（PageVO，后端暂未用于上述接口，预留） ============

export interface PageVO<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
