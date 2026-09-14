# tsa-web 速览

- 结构：`src/app/(site)/**` 官网（Tailwind）、`src/app/(admin)/admin/**` 后台（TDesign React）、`src/lib/` API 层。
- 后端：同仓库 `tsa-api`（Spring Boot，端口 8080，前缀 `/tsa`），地址由 `NEXT_PUBLIC_API_BASE_URL` 注入，默认 `http://localhost:8080`。
- 请求统一走 `src/lib/api.ts`（axios 封装，解 `Result{code,message,data}`，失败抛 `ApiError`）；类型与后端 DTO 逐字段镜像于 `src/lib/types.ts`。
- 构建：`npm run dev` / `npm run build`（`output: 'export'` 静态导出到 `out/`，勿改）；`npx tsc --noEmit`、`npm run lint`。
- 约定：金额单位为「元」不做 /100 换算；响应 id 为字符串、Save 请求 id 为数字；时间为带时区 ISO 8601；git 操作统一由主控执行，此处不 commit。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
