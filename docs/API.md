# 接口契约(Web 消费面)

这份文档是 `tsa-web` 与 `tsa-api` 之间**Web 侧的消费契约**:
页面照它调接口,`src/lib/types.ts` 与 `src/lib/{site,admin}-api.ts` 照它实现。
后端侧的全量权威契约在 `TownshipAssociation-Api/docs/API.md` —— 本文只收 Web 用到的子集,
**改任何一边都要同步改另外两边**(types.ts / 本文 / lib 层函数,见 DEVELOPMENT §6)。

小程序端契约在 `tsa-miniprogram/docs/API.md`,同源字段两边口径必须一致。

---

## 统一响应壳(不可协商)

```jsonc
{
  "code": 200,        // 200 = 成功;其余为业务错误码
  "message": "操作成功", // 失败时给用户的中文提示
  "data": {},         // 载荷;失败时可以为 null
}
```

`lib/api.ts` 的 `request()` 统一拆壳:调用方**永远只拿到 `data`**,失败收 `ApiError(code, message)`。
后端 HTTP 状态码恒 200,成败看 `code`;个别网关层错误会以非 2xx HTTP 形态到达,
`request()` 将其收口为 `ApiError(-1, "HTTP <status> …")` —— `isUnauthorizedError()` 的
文案匹配依赖这个格式,**两处注释不许单删**。

### 分页结构(PageVO)

```jsonc
{ "list": [], "total": 0, "page": 1, "pageSize": 10 }
```

分页接口(web 消费面):事件列表、社区动态列表、管理端事件/动态/评论列表。
公告与基金会三个接口**不分页**,一次给全。

---

## 错误码(Web 会遇到的)

| code | 含义 | 前端行为 |
| --- | --- | --- |
| `200` | 成功 | 返回 `data` |
| `400` | 参数校验失败(含 `yearFrom > yearTo`、越界分页) | toast `message`(内含字段提示) |
| `401` | 管理端未登录/token 过期 | 全局兜底:清 token、`adminQueryClient.clear()`、提示「登录已过期」、跳 `/admin/login`(挂在 adminQueryClient 的 QueryCache/MutationCache onError,业务码 401 与 HTTP 401 两路都判) |
| `1002` | 数据不存在(详情/更新/审核无 id 命中) | toast `message` |
| `1306` | 管理端登录限频 | 登录页 toast「尝试太频繁,稍后再试」,**不清已登录态** |
| `1307` | 管理端用户名或密码错误 | 登录页 toast「用户名或密码错误」 |
| `-1` | (仅前端)HTTP 非 2xx / 网络失败 / 响应非 Result 结构 | 后台 `describeApiError` 给「网络异常,请确认后端服务已启动」类提示;官网渲染 ErrorHint + reload 出口 |

---

## 鉴权

Web 只有**一套身份:管理端 Bearer**。小程序那套(微信 openid 登录、`X-Assoc-Token` 核验)
Web 完全不消费,`/tsa/user/**`、`/tsa/auth/wechat-login` 等端点不出现在本仓库。

```
POST /tsa/auth/admin-login
  body: { "username": "...", "password": "***" }
  200 : AdminLoginVO { token, username, role }   // role: 1 超级管理员 / 2 普通管理员
  错误: 400(空参)/ 1307(账密错)/ 1306(限频)

POST /tsa/auth/admin-logout
  header: Authorization: Bearer <token>(可缺;无 token 也幂等 200)
  200 : null                                     // 只注销当前 Bearer 会话

GET /tsa/admin/auth/me
  header: Authorization: Bearer <token>
  200 : { username, role }                       // token 失效 → 401(触发全局兜底)
```

- 令牌由后端 Sa-Token 签发;前端存 `localStorage`(键 `tsa_admin_token`,用户名兜底
  `tsa_admin_username`),此后每个 `/tsa/admin/**` 请求带 `Authorization: Bearer <token>`,
  **注入点唯一**:`lib/admin-api.ts` 的 `token()`;
- 后台读列表有一部分**刻意复用公开读接口**(不带 token,见下「基金会管理」数据源),
  写操作全部走 `/tsa/admin/**`;
- 登录态变化(登录/登出/跨页签)经 `lib/admin-auth.ts` 的订阅机制广播
  (自定义事件 + storage 事件,与 `useSyncExternalStore` 兼容)。

---

## 公开读接口(官网,无鉴权)

```
GET /tsa/foundation            → FoundationHome { rewards: RewardItem[], donations: DonationItem[] }
GET /tsa/foundation/rewards    → RewardRecords  { categories: string[], records: RewardRecord[] }
GET /tsa/foundation/donations  → DonationRecord[]                  // 后端按日期倒序

GET /tsa/notices               → Notice[]                          // 置顶优先、发布时间倒序,不分页
GET /tsa/notices/{id}          → Notice                            // 查无 code=1002

GET /tsa/events                query: page(默认1), pageSize(默认10,后端钳 1..50),
                                      year | yearFrom/yearTo(4 位年份,含界,任一侧可缺=开区间)
                               → PageVO<EventListItem>             // 按 start_time 倒序
  // year 为旧单年参数(保留兼容);web 年份区间筛选传 yearFrom/yearTo,yearFrom>yearTo → 400

GET /tsa/community/posts       query: page, pageSize, type(food|campus), cuisine, region(code), keyword
                               → PageVO<CommunityPost>             // 只含已过审(status=1),发布时间倒序
GET /tsa/community/posts/{id}  → CommunityPost(含 commentsList,评论同样只含已过审)
```

- **事件正文不进 Web**:列表 VO 即全部(`id title cover summary articleUrl startTime status`),
  2026-09-14 契约 C5 起**无详情页**,列表点击直跳 `articleUrl`(公众号永久链接,可空则置灰);
  `status`(upcoming|past)由后端按 Asia/Shanghai 当前时刻派生,前端不比时间;
- `articleUrl` 是后补键,**线上旧 jar 不下发**,消费处一律 `?? null` 容错(契约注释在 types.ts);
- 基金会/公告/事件/社区的公开读同时是**管理后台对应列表的数据源**(省去一套只读管理接口)。

---

## 社区动态写接口(官网,匿名,发布送审)

网站不受微信平台 5.7.1 主体类目限制,UGC 读写在 Web 正常提供 ——
与小程序「社区前端下线」的差异是**刻意的**(见 TECHNOLOGY §1)。

```
POST /tsa/community/posts            body: CommunityPostSaveRequest   → string(新动态 id)
POST /tsa/community/posts/{id}/like  (无 body)                         → number(点赞后总数)
POST /tsa/community/posts/{id}/comments  body: CommunityCommentSaveRequest → CommunityComment
POST /tsa/community/uploads          multipart 字段名 "file"(公开)      → { path: "/tsa/files/<uuid>.<ext>" }
```

  **审核制(2026-09-14 起)**:发布与评论**一进库就是待审(status=0)**,
  管理台过审(status=1)后才出现在公开列表/详情;驳回为 status=2(可逆,再放行即可)。
  前端不拿 status 自查过滤 —— 公开接口恒只下发已过审是后端职责;
- 一期无登录:作者为表单自由填写的昵称(≤限长以后端校验为准);点赞只计数 +1,无取消、无幂等;
- 图片**选图即传**公开上传端点(`/tsa/community/uploads`),发布请求只带服务端返回的**相对路径**;
  大小/类型限制以后端 `UploadRules` 与其 docs/API.md 为准,前端超限依赖后端 400 的 message 文案;
- 校验失败(标题 5~30、内容 10~1000、评论 ≤500 等)一律 400,toast 后端 message。

---

## 管理端接口(全部 `Authorization: Bearer`,未登录/过期 401)

### 基金会

```
POST   /tsa/admin/foundation/categories   body: RewardCategorySaveRequest   → string(id)
PUT    /tsa/admin/foundation/categories/{id}                                 → void
DELETE /tsa/admin/foundation/categories/{id}                                 → void   // 连带删除其下获奖记录
POST   /tsa/admin/foundation/records      body: RewardRecordSaveRequest      → string
PUT    /tsa/admin/foundation/records/{id}                                    → void
DELETE /tsa/admin/foundation/records/{id}                                    → void
POST   /tsa/admin/foundation/donations    body: DonationSaveRequest          → string
PUT    /tsa/admin/foundation/donations/{id}                                  → void
DELETE /tsa/admin/foundation/donations/{id}                                  → void
```

- `RewardRecordSaveRequest.categoryId` 是**数字**(从列表拿到的 id 是字符串,提交前 `Number()`);
- `DonationSaveRequest.amountVisible` 缺省 false=保密,保密笔在公开读接口里 `amount=null`;
- 列表数据源复用公开读(见上节),管理端不另设 foundation GET。

### 公告

```
GET    /tsa/admin/notices        → Notice[]        // 置顶优先、发布时间倒序,不分页
POST   /tsa/admin/notices        body: NoticeSaveRequest → string(id)
PUT    /tsa/admin/notices/{id}   body: NoticeSaveRequest → void    // id 只走路径,请求体无 id 字段
DELETE /tsa/admin/notices/{id}   → void
```

`publishedAt` 语义:新增不传=当前时间;修改不传=保留原发布时间。`pinned` 缺省不传=false。

### 乡会事件(2026-09-14 起可管理,删除即下架)

```
GET    /tsa/admin/events         query: page, pageSize, keyword(标题模糊)
                                 → PageVO<EventListItem>   // 复用公开列表 VO,start_time 倒序
POST   /tsa/admin/events         body: EventSavePayload { title, cover, summary, articleUrl, startTime } → string
PUT    /tsa/admin/events/{id}    body: EventSavePayload → void
DELETE /tsa/admin/events/{id}    → void
POST   /tsa/admin/events/cover   multipart 字段名 "file"(带 admin token)→ { path }   // 封面相对路径回填 cover
```

`cover` 传上传返回的相对路径;`startTime` 为 ISO 8601 带时区(`pickerDateTimeToApi` 统一 +08:00 口径)。

### 社区审核台(动态 + 评论)

```
GET /tsa/admin/community/posts     query: page, pageSize, status(0|1|2,缺省全部), type(food|campus)
                                   → PageVO<CommunityPost>    // 含待审/驳回,status 字段在此消费
PUT /tsa/admin/community/posts/{id}/audit   body: { "status": 1|2 } → void   // 1 通过 / 2 驳回(可恢复)
GET /tsa/admin/community/comments  query: page, pageSize, status, postId(只看某动态下)
                                   → PageVO<CommunityComment> // postId 为 2026-09-15 起列表下发的键
PUT /tsa/admin/community/comments/{id}/audit  body: { "status": 1|2 } → void
```

审核状态字典:`0 待审 / 1 已过 / 2 已驳`,动评共用。

---

## 文件与图片 URL 口径

```
GET /tsa/files/<uuid>.<ext>      公开,按扩展名回 Content-Type
  // name 必须匹配 ^[0-9a-f-]{32,36}\.[a-z]{3,4}$,否则 404(后端防目录穿越)
```

- 入库与响应里出现的都是**相对路径**(`/tsa/files/…`);
- 展示时经 `lib/api.ts` 的 `buildFileUrl()` 拼绝对址:外链(http 开头)原样透传;
  **生产构建 `API_BASE` 为空串(同源),相对路径本身可达**,函数对两种形态都正确;
- 上传端点选择:社区图 → `/tsa/community/uploads`(公开);后台封面 → `/tsa/admin/events/cover`
  (Bearer)。小程序的 `/tsa/files`(微信 Bearer 体系)与后台无关,Web 不调。

---

## 字段约定

| 约定 | 原因 |
| --- | --- |
| 响应里的 `id` 一律**字符串**(如 `"12"`) | 后端 Long 超 2^53 时 JS number 丢精度;**Save 请求里的外键 id 是数字**(如 `categoryId: 3`)——Jackson 两种都收,按后端 DTO 类型来 |
| 时间一律 **ISO 8601 带时区**(如 `2026-08-10T00:00:00+08:00`) | 数字时间戳无时区语义;格式化在前端;日期型请求字段固定 +08:00 口径(`pickerDateToApi`) |
| 金额单位「**元**」,不做 `/100` 换算 | 与库表、与小程序同口径;`formatYuan` 千分位、`formatAmount` 万位是两套展示(后台/官网),别混用 |
| 可空 VO 字段分两副面孔(§4 DEVELOPMENT) | 后端类带 `@JsonInclude(NON_NULL)` 的 null 键整体缺省;不带的键恒在 —— TS 声明与消费端 `?.`/`??` 都要跟着变 |
| 字典类查询参数传 **code**(如 `region=longdong`),展示经 `regionLabel` 反查 | 与小程序同源字典(`COMMUNITY_REGIONS`/`CUISINE_OPTIONS`),后端字典就位前两边手改同步 |

---

## 前缀与 baseURL

- 所有接口在 `/tsa` 前缀下。**`API_BASE` 不含 `/tsa`**,path 自带 ——
  `/tsa` 归后端 Controller 拥有,base 里再写一次拼出 `/tsa/tsa/...` 双前缀;
- `NEXT_PUBLIC_API_BASE_URL` 三态:`.env.development` = `http://localhost:8080`(本机联调,
  线上未部署的审核制新接口只能这样验);`.env.production` = **空串**(同源相对路径,
  apex/www 双域名一套产物);**未设置**才兜底 localhost(所以用 `??` 不用 `||`);
- 该值是编译期内联常量:改地址 = 重新构建部署;同源反代形态下永远不需要改 CORS。
