# 开发规范

本项目的**唯一编码规范出处**。适用范围:`src/` 下所有 `.tsx` / `.ts` / `.css`,以及 `scripts/`。

规范分三类,标注在每节标题:

- **【强制】** 违反则不予合并
- **【建议】** 默认遵守,有更好理由可偏离并在评审时说明
- **【参考】** 背景知识

机器可强制的条目落在 ESLint(`eslint.config.mjs`:next core-web-vitals + typescript)与
`tsc --noEmit`。**本项目没有 husky / commitlint 钩子**,见 §11。
技术事实与踩坑的来龙去脉在 [TECHNOLOGY.md](TECHNOLOGY.md),接口细节在 [API.md](API.md)。

---

## 1. 组件结构:RSC 边界【强制】

`output: "export"` 下所有页面构建期预渲染,**取数与交互必然在客户端**。边界规则:

| 文件 | 指令 | 原因 |
| --- | --- | --- |
| `layout.tsx`(根/组布局) | Server Component,**不加** `"use client"` | 只负责 metadata、样式导入、挂壳。CSS 导入(`import "./site.css"`)可以出现在 Server 文件里 |
| 需要路由钩子/取数/状态/事件的组件与页面 | 首行 `"use client"` | `usePathname`、`useAsyncData`、表单、TDesign 命令式组件都要求客户端 |
| 纯展示、无状态无事件的组件 | 不加 | 保持 Server,产物更小 |

两条铁律:

1. **客户端模块不能 import 服务端专属符号,反之亦然** ——
   典型事故:TDesign 的 React 19 适配器若在 Server Component 里导入只会跑在服务端,
   客户端调用 `MessagePlugin` 照抛 `reactRender is not a function`
   (`admin-shell.tsx` 首行注释在案)。
2. 页面(`page.tsx`)允许是薄 Server 壳(只出 metadata、渲染一个 client 组件),
   如 `(site)/community/chronicle/page.tsx`;也允许整体 client(如首页,静态骨架与取数交织)。
   **同一个文件里不许一半一半地摇摆**:定了 `"use client"` 就没有服务端部分。

---

## 2. 命名规范【强制】

| 对象 | 规则 | 正例 | 反例 |
| --- | --- | --- | --- |
| 组件/模块文件 | `kebab-case.tsx`,语义名,不加类型后缀 | `admin-shell.tsx`、`community-board.tsx` | `AdminShell.component.tsx` |
| 页面文件 | Next 约定死:`page.tsx` / `layout.tsx`,所在目录即路由 | `(admin)/admin/notices/page.tsx` | 在 page 里塞多个导出组件当多页 |
| API 函数 | `fetch<域>()`(读)、`create/update/delete<域>()`(写)、`describe<场景>Error()`(错误文案) | `fetchAdminNotices`、`describeLoginError` | `getNotices2`、`handleError` |
| 格式化函数 | `format<对象>`;表单/接口日期互转 `pickerDateToApi` / `apiToPickerDate` | `formatDateTime`、`formatYuan` | `dateUtils` |
| 类型 | PascalCase,镜像后端 VO 时**注释里带后端类名** | `/** 公告(NoticeVO…) */ interface Notice` | `TNotice`、`NoticeDto2` |
| CSS Module 类 | camelCase(经 `style.xxx` 引用) | `style.loginWrapper` | 全局裸类名(会撞 TDesign) |
| 官网自定义类 | `site-` 命名空间 + BEM 味 | `site-hero__bg`、`site-card` | `.box`、`.title` |
| 布尔量 | `is`/`has`/`show` 前缀 | `showPsw`、`isUnauthorizedError` | `flag` |

**禁止**:单字母变量(循环除外)、`data1/temp/obj` 无语义名、
页面里内联对象字面量类型(进 `lib/types.ts`)。

---

## 3. 目录分层与依赖方向【强制】

```
app/(site)/**   ──→ components/site/** ──→ lib/site-api.ts  ─┐
app/(admin)/**  ──→ components/admin/** ─→ lib/admin-api.ts ─┼→ lib/api.ts → lib/types.ts
                                     lib/admin-auth.ts ──────┘
```

### 各层允许与禁止

| 层 | 允许 | **禁止** |
| --- | --- | --- |
| `app/**` 页面 | 路由级组装、metadata、调 hook/取数 | ❌ 直接 `axios.get`(绕过拆壳与错误口径);❌ 写可复用的取数逻辑(下沉组件层) |
| `components/site/` | 展示 + 事件上抛 + 自带取数的板块组件(板块即页面单元) | ❌ import `lib/admin-api`(两界不互通,见下) |
| `components/admin/` | 后台壳(chrome 移植件)、表单辅助、UI 状态 | ❌ import `lib/site-api`(两界不互通,纯展示件例外,见下) |
| `lib/api.ts` | 网络、拆壳、`ApiError`、文件 URL、上传 | ❌ 出现任何业务字段名 |
| `lib/site-api.ts` / `lib/admin-api.ts` | 声明接口、拼 query、注入 token | ❌ `if/else` 业务判断;❌ base 里再拼 `/tsa`(双前缀) |
| `lib/admin-auth.ts` | localStorage 读写 + 变更订阅 | ❌ 掺入接口调用(它被 api 层引用,反向依赖成环) |
| `lib/types.ts` | 契约的单一事实来源 | ❌ 放运行时代码 |

### 官网与后台的两道墙

1. **样式互不渗透**:TDesign 全局 CSS 只在 `(admin)/admin/layout.tsx` 导入;
   Tailwind utilities 用在官网,后台 JSX 里出现 `className="flex …"` 只允许是布局微调,
   颜色圆角一律走 `--td-*`。
2. **组件单向复用**:纯展示件可以 site → admin(如 `admin-shell` 用 `site/reveal` 做进场动画,
   口径「与官网同感」),**反向禁止**。admin 专属逻辑绝不进 site。
3. **API 层不互用**:后台页不得拿 `site-api` 的函数当管理数据源(读列表可以复用公开接口,
   但必须经 `admin-api` 重新导出,保持管理端一册可查)。

### 组件设计

- **后台控件 TDesign 优先**:表格用 `Table`、弹层用 `Dialog`、日期用 `DatePicker`,
  与小程序规范同理 —— 手绘等价物丢设计 token 和交互细节。
- 板块组件(board)自带取数是本站现实(首页两路 `useAsyncData` 各管各的兜底);
  但**纯展示碎片**(卡片行、徽章)保持 props 进事件出,便于换宿主。

---

## 4. TypeScript 规范【强制】

```ts
// ✅ 类型导入与值导入分开
import { request } from "@/lib/api";
import type { Notice } from "@/lib/types";
```

- 路径别名 `@/` → `src/`,禁止 `../../lib/xxx` 深跳。
- **VO 可选性的两副面孔必须照抄后端**(镜像注释里写清是哪副):
  - 后端类带 `@JsonInclude(NON_NULL)`(如 `RewardRecord`、`CommunityComment`):
    null 字段**整个键缺省** → TS 写 `field?: T | null`;
  - 不带(如 `EventListItem`):可空字段**键恒在值为 null** → TS 写 `field: T | null`。
    写错的后果是消费处 `?.` 与 `??` 用错位置,旧后端未下发新键时整页白屏。
- **对尚未部署的契约字段按「可能缺键」容错**(`articleUrl` 等,注释标契约日期),
  线上旧 jar 不会等你。
- 禁止 `any`;确需收窄用 `unknown` + 判型,绕 ESLint 必须留行内原因注释。
- 枚举语义用字符串字面量联合(`type EventStatus = "upcoming" | "past"`),不用 TS `enum`。
- 提交前 `npx tsc --noEmit` 必须干净;路由删改后先清 `.next/types` 再判(TECHNOLOGY §4)。

---

## 5. 数据获取:两套机制各司其职【强制】

| 端 | 机制 | 原因 |
| --- | --- | --- |
| 官网 | `components/site/shared/use-async-data.ts` 的 `useAsyncData(loader, key)` | 只读、进页一次、失败只要「重试出口」。状态机语义见文件头注释(key 变重取、loader 引用变化**不**重取、不在 effect 体同步 setState) |
| 后台 | TanStack Query(`useQuery` / `useMutation`) | 列表失效、保存后刷表、并发去重都是刚需 |

硬性规则:

1. 后台所有读写走 `adminQueryClient`(模块级单例)管到的通道 ——
   **401 全局兜底、retry 策略都挂在它身上**,绕过它的裸 promise 拿不到这些保障。
2. 写操作成功后**必须** `queryClient.invalidateQueries` 对应 queryKey
   (约定:`["admin", <域>]`,如 `["admin", "notices"]`),禁止整页 `router.refresh()` 代替。
3. `queryKey` 必须含全部影响结果的参数(分页/筛选),漏一个就是「切页不刷新」类 bug。
4. 官网两路数据各自兜底,**单路失败不拖垮整页**(首页模式);兜底 UI 用
   `state-blocks` 的 `ErrorHint/EmptyHint/ListSkeleton`,不许裸 `try { } catch { }` 吞掉。
5. staleTime 30s、关窗口聚焦重取,已是全局默认;个别页要更激进就在调用点覆盖并注释。

---

## 6. API 层规范【强制】

调用链:`页面/组件 → lib/{site,admin}-api.ts → lib/api.ts request() → 后端`。

- 页面**永远不碰** `code` / `message`:成功拿 `data`,失败收 `ApiError`。
- token 只在 `admin-api.ts` 内部经 `token()` 注入,页面层不感知 `Authorization` 头。
- path 一律自带 `/tsa` 前缀写全;`API_BASE` 里没有 `/tsa`(双前缀是事故,见 API.md 尾节)。

### 新增/修改接口必须同步三处

| 位置 | 内容 |
| --- | --- |
| `src/lib/types.ts` | 字段镜像(含两副可选性面孔与后端类名注释) |
| `docs/API.md` | 人类可读契约(路径、参数、语义、错误码) |
| `src/lib/*-api.ts` | 函数与 query 拼接 |

**漏第二项**是双仓库并行开发最容易出的事故:后端按自己想象实现,联调两边对不上。
后端侧的全量权威契约在 `TownshipAssociation-Api/docs/API.md`,本仓库的 API.md 只收
「Web 消费面」,两边同源字段不许互相发明。

---

## 7. 样式规范【强制】

### 官网(Tailwind + site.css)

- 布局/间距/响应式用 Tailwind utilities 直写 JSX;
- **成组的品牌视觉**(hero 衬底、`site-card`、进场动画、法务文档排版)沉淀在
  `(site)/site.css` 的 `site-*` 类里,JSX 不重复发明;
- 品牌色字面值现状:官网以 `#faf5ea`(hover 底色一类)与 site.css 内的深蓝/金色族为主,
  散在 site.css 与少量 Tailwind arbitrary value(`bg-[#faf5ea]`)里;
  **新增颜色一律先进 site.css 定义语义类/变量再引用**,禁止在 JSX 里散落新 hex ——
  字面值palette 扩到第三组色时,把这条升格为全量 token 化整改;
- `globals.css` 是根级基座(字体、深浅色变量、body 壳),别往里塞页面私有样式。

### 后台(TDesign + CSS Module)

- 组件样式走 TDesign token:颜色/圆角/字号一律 `var(--td-*)`;
  个别覆盖写在 `chrome/admin-theme.css`(全站唯一 token 调整入口,如圆角与官网对齐)
  或就近的 `.module.css`;
- `components/admin/chrome/` 的模块 CSS 是模板 less 的手工编译物,**结构尽量保持原样**,
  方便回查模板源码;
- 图片资源直链 `/public` 根路径(`url("/home-hero.jpg")`,**不带 `/public`**,TECHNOLOGY §8);
- 用 `classnames`(站点已依赖)拼条件类,不用模板字符串手搓。

---

## 8. 注释规范【强制】

- **中文**,解释为什么,不复述是什么。
- **每一个「看起来很多余」的写法必须配原因注释**,并且没人可以再删。本项目已知的路标:
  - `admin-shell.tsx` 首行 react-19-adapter 导入(es/ 路径与客户端模块两个约束);
  - `lib/api.ts` 的 `??` 读 env(空串=同源)与 `"HTTP 401"` 文案(被 `isUnauthorizedError` 依赖);
  - `login.module.css` `.btnContainer` 用 padding 不用 margin(TDesign 双规则);
  - `flatten-rsc.mjs` 全文件(Next 16 静态导出错位);
  - 守卫 effect 直接读 `getAdminToken()` 而非用订阅值(hydration 误判)。
- 契约字段注释带**日期与契约号**(如「2026-09-14 C5 增补,旧后端缺键」),
  这类注释是判断「能不能删掉容错分支」的唯一依据。
- 被注释掉的旧代码一律删除;`TODO` 必须写成 `TODO(负责人或阶段): 动作`。

---

## 9. 错误处理与用户反馈【强制】

- 统一异常类型 `ApiError`(`code` 为后端业务码;HTTP/网络层收口为 `-1`)。
  判登录失效只许用 `isUnauthorizedError()`,判失败文案只许用 `describeApiError()/
  describeLoginError()`,禁止页面里裸比对 `code === 401`(文案口径会漂移)。
- 后台:失败必上 `MessagePlugin.error/danger`,成功上 `success`;按钮 `loading` 防重复提交。
- 官网:失败渲染 `ErrorHint` 并给 `reload()` 出口;空列表给 `EmptyHint`,文案要说下一步做什么
  (❌「暂无数据」 ✅「还没有过审的动态,去发布第一条」)。
- 破坏性操作(删除公告/事件/捐赠、驳回动态)必须 `DialogPlugin.confirm` 二次确认。
- **前端隐藏 ≠ 数据没下发**。审核制下「公开列表只含已过审」是后端职责,
  前端不得拿 `status` 字段自己过滤充数(拿到也只是为了管理端展示)。

---

## 10. 静态导出硬约束【强制】

| 不要 | 因为 |
| --- | --- |
| 改 `next.config.ts` 的 `output: "export"` / `images.unoptimized` | 部署形态地基(TECHNOLOGY §6);动了产物就不是能扔给 Nginx 的东西了 |
| 删 `postbuild` 钩子或改 `flatten-rsc.mjs` 的幂等语义(增删改原有文件) | 软导航预取会整片 404;脚本必须可重复执行 |
| 使用 middleware、route handler、Server Action、动态 revalidate | export 模式全部不可用,构建期直接报错 |
| 指望 SSR 取数 | 构建期没有后端的网络环境,数据必然客户端取 |
| 把绝对 URL 写进会入库的字段/请求体 | 存相对路径、展示时 `buildFileUrl`,换域名不炸(§6) |

---

## 11. Git 工作流【强制】

- **git 操作统一由主控执行**(AGENTS.md 约定),子代理与学生只交工作区,不自行 commit。
- 提交格式与小程序仓库同源:`<type>: 中文 subject`(type 用 feat/fix/docs/style/
  refactor/perf/test/chore);标题说改了什么,正文说为什么。
- 提交前三连,全绿才算完成:

```bash
npx tsc --noEmit && npm run lint && npm run build
```

- **lockfile 只许一份**:当前是 `package-lock.json`(npm)。哪天迁移 pnpm,
  同一提交里删掉旧锁、改 README 与文档,不留两份锁装出两棵树。
- `.mcp.json` 等工具配置随仓库提交(多机一致),不进 gitignore。

---

## 12. Code Review 清单【建议】

1. **契约三处同步**(types / API.md / lib 层函数)—— 最高优先级;
2. 依赖方向越界没(页面直连 axios?admin 引用 site-api?);
3. RSC 边界:该 `"use client"` 的有没有,不该加的有没有整文件误加;
4. VO 可选性镜像对了没(两副面孔,§4);未部署字段有没有 `?? null` 容错;
5. 后台 mutation 后 invalidate 了对应 queryKey;queryKey 含全部参数;
6. 有没有动 §10 硬约束里的东西(output、postbuild、绝对 URL);
7. 那些「看起来多余」的注释还在不在;
8. 文案:错误提示是否说明下一步;空态是否给出口;
9. `npx tsc --noEmit && npm run lint` 干净。

---

## 13. 规范的强制方式

| 条目 | 由谁强制 |
| --- | --- |
| next 官方规则(hook 依赖、`<img>` 告警、a11y)、TS 未用变量等 | ESLint(next 两套配置) |
| 类型镜像、可选性两副面孔 | tsc 只兜类型层,**镜像正确性靠 review** |
| 分层依赖方向、契约三处同步、注释质量、样式边界、mutation 后失效 | ⚠️ 无自动检查,靠 code review 与本文档 |
| 静态导出产物正确性 | `npm run build` 人工盯 flatten 输出与 404 |

无 husky 是当前现状(钩子在小程序仓库,本仓库未装)。把分层做成硬约束的候选:
`import/no-restricted-paths`、给 `output: export` 加构建期断言 —— 有意做时先开 issue 讨论。
