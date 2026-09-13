# tsa-web · 广工胶己人（官网 + 管理后台）

Next.js（App Router）+ Tailwind CSS（官网）+ TDesign React（后台）+ TanStack Query，单域名、静态导出（`output: 'export'`）。后端为同仓库的 `tsa-api`（Spring Boot，端口 8080，接口前缀 `/tsa`）。

## 目录结构

- `src/app/(site)/**` —— 官网页面（Tailwind 风格）
- `src/app/(admin)/admin/**` —— 管理后台（URL 前缀 `/admin`，TDesign 风格）
- `src/lib/api.ts` —— 统一 axios 封装（解 `Result{code,message,data}`，`ApiError`，Bearer token）
- `src/lib/admin-auth.ts` —— 管理端 token 的 localStorage 读写（key：`tsa_admin_token`）
- `src/lib/types.ts` —— 与后端 DTO 逐字段镜像的 TS 类型

## 本地开发

```bash
npm install
cp .env.example .env.local   # 按需改 API 地址，默认 http://localhost:8080
npm run dev                  # http://localhost:3000，需本机 8080 起好 tsa-api
```

## 构建

```bash
npm run build   # 纯静态产物输出到 out/（无 Node 服务端）
```

## 部署

`npm run build` 产出 `out/` 目录，把 `out/` 整体上传到香港服务器的 Nginx 站点根目录即可；同一域名下由 Nginx 将 `/tsa` 路径反向代理到本机/内网的 tsa-api（8080），前端与 API 同源、单域名，无需 Node 运行时。构建前通过环境变量 `NEXT_PUBLIC_API_BASE_URL` 注入后端地址：同源反代方案下设为站点自身的公网域名（如 `https://your-domain.com`，请求即打到 `https://your-domain.com/tsa/...`）；未设置时默认 `http://localhost:8080`（仅适合本地开发）。Nginx 静态站点建议配 `try_files $uri $uri.html $uri/index.html /index.html;`（`out/` 同时生成 `admin.html` 与 `admin/index.html` 两种形态）。

## 约定

- 金额单位一律「元」，前端不做 `/100` 换算；捐赠 `amount` 可为 `null`（保密）。
- 后端 Long 型 id 序列化为字符串；管理端 Save 请求里的 id 字段是数字。
- 时间字段为带时区 ISO 8601 字符串（`yyyy-MM-dd'T'HH:mm:ssXXX`）。
