/**
 * 管理端登录态：token 存 localStorage，仅供客户端组件使用（服务端渲染阶段返回 null）。
 */
const TOKEN_KEY = "tsa_admin_token";
const USERNAME_KEY = "tsa_admin_username";
/** 同页签内 localStorage 不触发 storage 事件，登录/登出用自定义事件通知订阅者 */
const AUTH_CHANGE_EVENT = "tsa-admin-auth-change";

function emitAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

/**
 * 订阅登录态变化（自定义事件 + 跨页签 storage 事件）。
 * 与 useSyncExternalStore 直接兼容：subscribe(onChange) => unsubscribe。
 */
export function subscribeAdminAuth(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  emitAuthChange();
}

export function clearAdminToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  emitAuthChange();
}

/**
 * 登录用户名：登录成功时随手存一份，仅供顶栏展示兜底；
 * 权威来源是 GET /tsa/admin/auth/me 的返回。
 */
export function getAdminUsername(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USERNAME_KEY);
}

export function setAdminUsername(username: string): void {
  window.localStorage.setItem(USERNAME_KEY, username);
}

export function clearAdminUsername(): void {
  window.localStorage.removeItem(USERNAME_KEY);
}
