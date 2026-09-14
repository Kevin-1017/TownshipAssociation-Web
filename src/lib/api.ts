import axios, { AxiosError } from "axios";
import type { ApiResult } from "@/lib/types";

/**
 * 后端地址：?? 语义——空串是合法值(同源相对路径)，只有「未设置」才走兜底。
 * 本地开发由 .env.development 注入 http://localhost:8080；
 * 生产构建由 .env.production 注入 https://gdutgaginang.cn（显式写死，
 * 将来静态层若单独搬家到 CDN 也只需改这一个文件重新构建）。
 * path 需自带 /tsa 前缀，由调用方给全。
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/**
 * 资源地址清洗（同小程序 buildFileUrl 口径）：后端下发的封面/图片可能给
 * 相对路径（/tsa/files/...，秘书处上传件），需拼域名；外链原样透传。
 * 注意生产构建 NEXT_PUBLIC_API_BASE_URL 为空串 = 同源部署，直接相对可达。
 */
export function buildFileUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  return pathOrUrl.startsWith("/") ? `${API_BASE}${pathOrUrl}` : pathOrUrl;
}

/** 业务错误：code 为后端 Result.code（非 200）；HTTP/网络层错误统一 code = -1 */
export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** 请求体对象，自动 JSON 序列化 */
  body?: unknown;
  /** 管理端鉴权 token，命中时加 Authorization: Bearer 头 */
  token?: string | null;
}

/** axios 实例：仅承载 baseURL，鉴权头/请求体按调用点透传 */
const http = axios.create({ baseURL: API_BASE });

/**
 * 统一请求（axios 实现）：解 Result{code,message,data}，
 * code!==200 抛 ApiError(code,message)；HTTP 非 2xx 与网络层错误抛 ApiError(-1,...)。
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  try {
    const res = await http.request<ApiResult<T> | undefined>({
      url: path,
      method: options.method ?? "GET",
      headers,
      data: options.body,
    });

    const json = res.data;
    if (json === undefined || json === null || typeof json.code !== "number") {
      throw new ApiError(-1, "响应格式异常：非 Result 结构");
    }
    if (json.code !== 200) {
      throw new ApiError(json.code, json.message);
    }
    return json.data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof AxiosError) {
      if (e.response) {
        // 非 2xx：与原 fetch 版一致，包成 code=-1 的 HTTP 提示（isUnauthorizedError 依赖该文案）
        throw new ApiError(-1, `HTTP ${e.response.status} ${e.response.statusText || ""}`.trim());
      }
      throw new ApiError(-1, e.message ? `网络请求失败：${e.message}` : "网络请求失败");
    }
    // 响应体 JSON 解析失败等 axios 之外的异常，同样按网络层错误收口
    throw new ApiError(-1, e instanceof Error ? `网络请求失败：${e.message}` : "网络请求失败");
  }
}
