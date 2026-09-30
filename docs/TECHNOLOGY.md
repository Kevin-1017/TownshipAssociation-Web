# 项目技术文档

广工潮阳潮南校友会官网与管理后台(`tsa-web`)的技术事实:选型与理由、版本约束、环境、
架构现状、部署拓扑、模板移植策略、已知平台坑。

**编码规范不在这里** —— 见 [DEVELOPMENT.md](DEVELOPMENT.md);
**接口契约** —— 见 [API.md](API.md)。

---

## 1. 项目定位

三仓库体系的第二个前端,一个仓库装**两个界面**:

1. **官网**( `(site)` 路由组)—— 面向公众的信息展示:公告、乡会事件、基金会公开数据、
   社区广场;**2. 管理后台**( `(admin)` 路由组,URL 前缀 `/admin`)—— 秘书处录入与审核入口。

与小程序(`tsa-miniprogram`)共用同一后端(`tsa-api`,独立仓库、8080 端口、`/tsa` 前缀)。
刻意共后端而不是各起一套:数据只有一份,展示端只是皮。

```
Project/
├── TownshipAssociation-Api/          Spring Boot 后端(独立 git 仓库)
├── TownshipAssociation-Miniprogram/  uni-app 小程序(独立 git 仓库)
└── TownshipAssociation-Web/          本仓库,Next.js 官网 + 管理后台(独立 git 仓库)
```

父目录不设 git 仓库,与小程序仓库同口径。

### 官网承接了小程序删掉的功能

小程序因**个人主体不可提供 UGC**(微信平台运营规范 5.7.1)整体下线了社区动态前端,
后端接口保留。Web 端不受微信平台约束,社区发布/点赞/评论照常上线(2026-09-14 起配
**审核制**:发布进待审队列,管理后台「动态审核」台过审后才公开可见)。
**两端这一功能差异是刻意的**,不要「对齐小程序」把它删了。

---

## 2. 技术选型与理由

| 层 | 选型 | 理由 | 代价 |
| --- | --- | --- | --- |
| 框架 | **Next.js 16 App Router,`output: "export"` 静态导出** | 文件系统路由天然承载「两个界面一套壳」(route group);预渲染 HTML 利于官网 SEO;产物是纯静态目录,Nginx 直接托管,**服务器不需要 Node 运行时** | 无服务端运行时:没有 middleware、没有 ISR、没有 `next/image` 优化;`/tsa` 反代责任移给 Nginx |
| 包管理 | **npm**(`package-lock.json` 入库) | 与后端构建环境解耦,学生上手零配置 | 严格度不如小程序仓库的 pnpm;**换包管理器必须整锁文件换掉,不许两份并存** |
| 语言 | **TypeScript 5,`strict: true`** | 契约字段多(`types.ts` 镜像后端全部 DTO),类型是防联调翻车的第一道闸 | — |
| 官网样式 | **Tailwind CSS v4** + `site.css` 自定义类 | 内容型站点的布局用 utilities 最快;品牌层(衬底、圆角、动效)沉淀在 site.css 的 `site-*` 类,一处改全站跟 | 两套样式体系并存(官网 Tailwind / 后台 TDesign),见 DEVELOPMENT §7 的分界 |
| 后台 UI | **TDesign React 1.18** + `tdesign-icons-react` | 与小程序 `@tdesign/uniapp` 同一设计体系,视觉一致;后台表格/表单/弹层组件齐,不用手写;版式移植自官方 starter 模板 | 见 §7 移植策略;React 19 适配有坑(§8) |
| 后台数据 | **TanStack Query 5**(单例 QueryClient,仅 `(admin)` 用) | 后台是重读重写场景:失效、重取、mutation 后刷新表格,手写会重复造轮子 | 官网刻意**不**用它 —— 官网全是进页一次性的只读拉取,`useAsyncData`(约 70 行)够用,少一层心智 |
| HTTP | **axios**(全站唯一出口 `lib/api.ts`) | 浏览器环境有 XHR,没有小程序「绕 fetch 封装」的历史包袱;超时/取消等能力现成 | — |
| 状态 | **无全局状态库** | 管理端唯一全局状态是登录 token(localStorage + `useSyncExternalStore` 订阅,见 `lib/admin-auth.ts`);页面数据都归 react-query 缓存管 | 将来跨页共享状态多了再评估 |

---

## 3. 版本约束【改任何一项前必读】

| 包 | 锁定 | 原因 |
| --- | --- | --- |
| `next` | **`16.3.5` 精确,无 `^`** | 本仓库大量依赖 Next 16 的具体行为(route group、静态导出、RSC 载荷布局);Next 的 minor 会带 breaking change(见 §9 的 RSC 镜像坑)。**升级必须全链路回归:dev → build → 部署演练** |
| `eslint-config-next` | `16.3.5` 精确 | 必须与 `next` 同版本 |
| `react` / `react-dom` | `19.2.8` | TDesign React 1.18 需要 React 19 适配器(§8 坑 2),这条链三家里任何一动都要重验后台的 Message/Dialog |
| `tdesign-react` | `^1.18.3` | 后台外壳与登录页按 1.x 手工移植,大版本升级需整体回归后台观感 |
| `typescript` | `^5` | Next 自带约束 |

`package.json` **没有** `engines` / `packageManager` 字段 —— 与小程序仓库不同,
这里没人替你拦 Node 版本。建议 Node 20+,与团队其余仓库对齐。

---

## 4. 环境与命令

```bash
npm install
npm run dev        # http://localhost:3000
```

本地开发默认连**本机 8080 的 tsa-api**(`.env.development` 写死
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`,因为审核制等新接口线上后端尚未部署,
连线上会被旧 jar 忽略)。服务器 8080 端口**不对公网开放**,想验线上接口走
`https://www.gdutgaginang.cn`(同源 `/tsa` 反代)。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 静态导出到 `out/`,**自动触发 postbuild 的 `scripts/flatten-rsc.mjs`**(见 §9,勿删) |
| `npm run start` | 本地起 Node 服务预览(**不代表生产形态**,生产是纯静态,见 §6) |
| `npx tsc --noEmit` | 类型检查。`.next/types` 是生成物,路由删改后报错先清这个目录再判 |
| `npm run lint` | ESLint(next/core-web-vitals + next/typescript) |

`.mcp.json` 配了 TDesign MCP Server(组件文档/DOM/变更日志查询),写后台前可先查真实 API。

---

## 5. 架构现状

```
                     浏览器
                        │
          ┌─────────────┴──────────────┐
          │  Nginx(单域名,apex/www 双证) │
          │  静态层 out/ + /tsa 反代 8080 │
          └──────┬──────────────┬──────┘
        /、/notices…  /admin/**   /tsa/**
          │           │           │
   ┌──────▼─────┐ ┌────▼─────┐ ┌──▼─────────┐
   │ (site)     │ │ (admin)  │ │  tsa-api   │
   │ 预渲染 HTML │ │ 同左,壳   │ │ Spring Boot│
   │ +客户端取数 │ │ +CSR 数据 │ │  :8080     │
   └────────────┘ └──────────┘ └────────────┘
```

`output: "export"` 意味着**所有页面构建期预渲染成 HTML**:数据不可能在服务端取,
一律浏览器起来后再发请求。因此全站没有 Server Action、没有 route handler,
`(site)` 的 `page.tsx` 只当「元信息 + 静态骨架」用,交互与取数全在 `"use client"` 组件里。

分层依赖(单向,违反即设计错误):

```
app/(site)/**   ──→ components/site/**  ──→ lib/site-api.ts ─┐
app/(admin)/**  ──→ components/admin/** ──→ lib/admin-api.ts ─┼→ lib/api.ts → lib/types.ts
                                    lib/admin-auth.ts ────────┘
```

- `lib/api.ts`:唯一网络出口(解 `Result{code,message,data}` 壳、抛 `ApiError`、
  `buildFileUrl` 资源路径清洗、`uploadImage`);
- `lib/site-api.ts` / `lib/admin-api.ts`:只声明接口与入出参类型,不写业务判断;
- `lib/types.ts`:与后端 DTO **逐字段镜像**,是契约的 TS 侧单一事实来源;
- `components/admin/chrome/`:模板移植件(§7),`components/site/`:官网板块件。

### 目录

```
src/
├── app/
│   ├── layout.tsx            根布局(字体、globals.css、metadata)
│   ├── (site)/               官网:首页 · about · notices(/detail) · events ·
│   │                         community(三栏+detail+发布) · foundation · legal(/agreement|privacy)
│   └── (admin)/admin/        后台:login · 工作台 · categories · records · donations ·
│                             notices · events · community(审核台)
├── components/
│   ├── site/                 官网组件,按域分组:layout · shared · community · events · foundation · home
│   └── admin/                chrome/(admin-shell 守卫+Provider · 移植壳) · shared/(form-helpers · ui-state)
├── lib/                      api · site-api · admin-api · admin-auth · site-format · types
└── types/                    静态资源模块声明(ambient)
```

route group 括号 `(site)` / `(admin)` **不进 URL**,作用只是各挂各的布局壳 ——
官网挂 SiteHeader/Footer,后台挂 TDesign 侧栏壳,共享根 `layout.tsx`。

---

## 6. 部署拓扑

1. `npm run build` → 纯静态产物 `out/`(postbuild 已做 RSC 镜像,§9);
2. `out/` 整体上传新加坡服务器 Nginx 站点根;
3. 同一 Nginx 把 `/tsa` 反代到本机 `tsa-api` 的 8080 —— **8080 不对公网开**;
4. 前端与 API **同源单域名**,`/tsa` 前缀在浏览器 Network 里可见,证书覆盖 apex 与 www 两域名。

必须知道的三个细节:

- **`NEXT_PUBLIC_API_BASE_URL` 是编译期内联常量**:改地址必须重新构建。生产构建
  `.env.production` 里**留空串** = 同源相对路径(`/tsa/...` 打到页面自己的域名),
  一套产物两域名通吃。`lib/api.ts` 用 `??` 而非 `||` 读取 —— 空串是合法值,
  这个写法旁边的注释不要删。
- **Nginx 要配** `try_files $uri $uri.html $uri/index.html /index.html;`
  —— 静态导出同时产出 `admin.html` 与 `admin/index.html` 两种形态,少一条就 404。
- 上传文件落后端本地磁盘(`tsa.files.dir`),经 `/tsa/files/...` 同源回读;
  库里存的是**相对路径**,展示时前端用 `buildFileUrl()` 拼绝对址 —— 把绝对 URL 写进
  存量数据,换域名那天会集体失效。

---

## 7. 后台外壳的来历与改法

管理后台视觉不是从零画的,来自官方模板 `tdesign-react-starter` 的**手工移植件**,现居
`src/components/admin/chrome/`(外壳骨架/菜单/顶栏/登录样式)与 `src/components/admin/shared/`
(form-helpers · ui-state)。移植时做了三件事:less → 手写 CSS Module、模板资源引用 →
`/public` 直链、演示功能(主题配置抽屉、扫码/注册登录、消息角标等)整块删除。
模板源码存档已随收尾从仓库移除,**改后台外壳 = 直接改 `components/admin/chrome/`**;
需要对照原版时看官方仓库 github.com/Tencent/tdesign-react-starter。

---

## 8. 已知平台约束与踩坑

| 现象 | 原因 / 解法 |
| --- | --- |
| 后台任意页调用 `MessagePlugin` / Dialog 抛 `reactRender is not a function` | React 19 移除了 `ReactDOM.render`,TDesign 命令式组件必须先在**客户端模块**导入官方适配器(`admin-shell.tsx` 首行 `import "tdesign-react/es/_util/react-19-adapter"`)。导入不能挪进 Server Component 的 layout,且路径必须用 `es/`(与包 `module` 字段指向同一份 react-render 实例) |
| 静态导出后站内跳转全部整页刷新,预取 404 | Next 16 已知错位:RSC 载荷按 `__next.<seg>/…` 目录产出,客户端却请求点号扁平形态;Vercel/next start 内置映射,纯 Nginx 没有。解法 = postbuild `flatten-rsc.mjs`(§9) |
| `url("/public/xxx.jpg")` 背景图不显示 | `public/` 下的文件在 CSS/HTML 里引用**不带** `/public` 前缀,用 `/xxx.jpg` |
| 后台表单「最后一项 margin 消失」甚至贴死上一项 | TDesign Form 的双规则:`> .t-form__item:last-of-type { margin: 0 }`(纯 CSS,按 DOM)+ 运行时把 `--last` 类加到**最后一个有 `name` 的注册项**上——无 `name` 的按钮项不注册,`--last` 会落到倒数第二项。要加间距用 `padding`,别用 `margin`(登录页 `.btnContainer` 注释在案) |
| 后台表格切页/刷新被踢回登录页,或已登录 F5 反被弹 | 登录态判定若用 `useSyncExternalStore` 的 server snapshot(hydration 期恒 null)会误判;`admin-shell.tsx` 的守卫 effect 直接读 `getAdminToken()` 真实值,`token` 仅作依赖触发跨页签登出(注释在案,别「顺手统一」) |
| `isUnauthorizedError` 依赖 `"HTTP 401"` **文案**识别 HTTP 层 401 | 后端 HTTP 状态恒 200、401 只出现在业务 code 里的约定被 axios 的非 2xx 分支包成 `code=-1` 字符串。改 `api.ts` 里那行文案必须同步改判定,两处都有注释 |
| CSS Module 文件 git 提示 LF→CRLF | 无功能影响,Windows 常态;提交前 `npx tsc --noEmit` + `npm run lint` 即可 |

---

## 9. 构建后置:`scripts/flatten-rsc.mjs`

Next 16 静态导出把 RSC 载荷写成 `__next.<段>/` 嵌套目录,而客户端导航预取请求的是
`__next.<段>.<文件>.txt` 点号扁平形态 —— `next start`/Vercel 在 server 里做了这层映射,
纯静态 Nginx 没有,于是**所有软导航预取 404,页面全部回退整页加载**。

脚本做的事:遍历 `out/`,把目录形态镜像复制成扁平形态,**只增不改不删,幂等可重跑**。
由 `postbuild` 钩子自动执行。

- 升级 Next 前先确认该上游行为是否修复,修复了再删脚本;
- 部署前看到 `[flatten-rsc] 生成扁平 RSC 镜像文件 N 个`(N>0)是**正常输出**,不是报错;
- 手动单跑:`node scripts/flatten-rsc.mjs out`。

---

## 10. 当前边界

### 已做

官网 7 组页面(首页/关于/公告+详情/事件/社区四栏+详情+发布/基金会/法务两页)、
管理后台 7 个业务页(工作台、基金会三类、公告、事件、社区审核台)、
admin 登录 + 全局 401 兜底、社区发布送审 + 评论审核、图片上传两通道、
静态导出 + 同源反代部署(apex/www)、滚动进场动效与官网后台同口径。

### 明确不做(原因)

| 不做 | 原因 | 何时重新评估 |
| --- | --- | --- |
| SSR / ISR / middleware 等任何依赖 Node 运行时的能力 | `output: "export"` 是部署形态的地基(§6),用了就塌 | 服务器愿意跑 Node 且换部署方式时 |
| 用户端注册/登录体系 | 与小程序共用「匿名 + 微信登录」的后端身份,Web 只做匿名读与社区匿名写;管理端登录只服务秘书处 | 二期若做会员自助 |
| 富文本编辑器 | 公告/动态正文是纯文本,上富文本要同时定 XSS 清洗面 | 内容形态真需要时 |
| 图片 CDN 化 | 上传件在后端磁盘、同源回读,量小 | 存储或带宽成为问题时 |
| CI/CD 自动构建部署 | 当前手动 `npm run build` + 上传可接受 | 团队多人并行改后端契约时 |
