"use client";

/** 后台界面状态：目前仅管理「侧栏折叠」 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AdminUIState {
  /** 侧栏菜单折叠 */
  collapsed: boolean;
  /** payload 为 null/undefined 时取反，传布尔则直接设值 */
  toggleMenu: (payload?: boolean | null) => void;
}

const AdminUIContext = createContext<AdminUIState | null>(null);

export function AdminUIProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // 挂载与 resize 时按视口宽度折叠(900/1000 双阈值, ~100ms 节流)
  useEffect(() => {
    const applyWidth = () => {
      if (window.innerWidth < 900) setCollapsed(true);
      else if (window.innerWidth > 1000) setCollapsed(false);
    };
    applyWidth();
    let last = 0;
    const onResize = () => {
      const now = Date.now();
      if (now - last < 100) return;
      last = now;
      applyWidth();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleMenu = useCallback((payload?: boolean | null) => {
    setCollapsed((prev) => (payload === undefined || payload === null ? !prev : !!payload));
  }, []);

  const value = useMemo<AdminUIState>(() => ({ collapsed, toggleMenu }), [collapsed, toggleMenu]);

  return <AdminUIContext.Provider value={value}>{children}</AdminUIContext.Provider>;
}

export function useAdminUI() {
  const ctx = useContext(AdminUIContext);
  if (!ctx) throw new Error("useAdminUI 必须在 AdminUIProvider 内使用");
  return ctx;
}
