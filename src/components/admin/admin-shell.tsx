"use client";

// React 19 移除了 ReactDOM.render，TDesign 命令式组件（MessagePlugin/DialogPlugin）
// 必须经官方适配器注入 createRoot，否则调用即抛 "reactRender is not a function"。
// 必须是「客户端」模块导入：(admin) layout 是 Server Component，在那边导入只会跑在服务端。
// 路径用 es/：与根入口 "tdesign-react"（package.json module → es/index.js）解析到的
// 同一份 react-render 模块实例对齐；本组件覆盖 /admin/**（含登录页），故在此统一挂载。
import "tdesign-react/es/_util/react-19-adapter";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loading, MessagePlugin } from "tdesign-react";
import {
  BookmarkIcon,
  CalendarIcon,
  ChatIcon,
  DashboardIcon,
  HeartIcon,
  NotificationIcon,
  StarIcon,
} from "tdesign-icons-react";
import {
  clearAdminToken,
  clearAdminUsername,
  getAdminToken,
  getAdminUsername,
  subscribeAdminAuth,
} from "@/lib/admin-auth";
import { adminLogout, adminMe, isUnauthorizedError } from "@/lib/admin-api";
import { AdminUIProvider } from "./starter/ui-state";
import AdminChrome from "./starter/chrome";
import Reveal from "@/components/site/reveal";
import type { StarterMenuItem } from "./starter/menu";

const LOGIN_PATH = "/admin/login";

/** 侧边菜单：value 直接用路由路径，与 pathname 一一对应（图标为模板 starter 风格新增） */
const MENU_ITEMS: StarterMenuItem[] = [
  { path: "/admin", label: "工作台", icon: <DashboardIcon /> },
  { path: "/admin/categories", label: "奖项类别", icon: <StarIcon /> },
  { path: "/admin/records", label: "获奖记录", icon: <BookmarkIcon /> },
  { path: "/admin/donations", label: "捐赠鸣谢", icon: <HeartIcon /> },
  { path: "/admin/notices", label: "公告管理", icon: <NotificationIcon /> },
  { path: "/admin/events", label: "乡会事件", icon: <CalendarIcon /> },
  {
    path: "/admin/community",
    label: "动态审核",
    icon: <ChatIcon />,
    children: [
      { path: "/admin/community/food", label: "美食基地" },
      { path: "/admin/community/campus", label: "校园资讯" },
    ],
  },
];

const getNullToken = () => null;

/** 401 兜底跳转的处理函数槽：AdminShell 挂载时注册（SSR/登录页时为空） */
let unauthorizedHandler: (() => void) | null = null;

/**
 * 后台专用 QueryClient（模块级单例，仅客户端使用）：
 * 任一 query/mutation 命中 401（HTTP 层或业务 code）即清 token 回登录页。
 */
const adminQueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (e) => {
      if (isUnauthorizedError(e)) unauthorizedHandler?.();
    },
  }),
  mutationCache: new MutationCache({
    onError: (e) => {
      if (isUnauthorizedError(e)) unauthorizedHandler?.();
    },
  }),
  defaultOptions: {
    queries: {
      retry: (count, error) => !isUnauthorizedError(error) && count < 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * 管理后台外壳：UI 状态 Provider + QueryClientProvider + 登录守卫，
 * 视觉框架为移植自 tdesign starter 模板的 AdminChrome（侧栏/顶栏/页脚/配置抽屉）。
 * /admin/login 也在本 layout 之下（组内路由），登录页走 bare 通道只套 Provider。
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === LOGIN_PATH;

  // localStorage 读取走外部订阅：水合阶段用 getNullToken，避免 SSR 快照不一致
  const token = useSyncExternalStore(subscribeAdminAuth, getAdminToken, getNullToken);

  // 无 token 访问业务页 → 回登录页。
  // 注意：F5 刷新走 hydration，useSyncExternalStore 该阶段快照取 getServerSnapshot(null)，
  // 若据此判定会把「已登录但刚刷新」误踢回登录页；这里直接读 localStorage 真实值判断，
  // token 仍留在依赖里用于响应跨页签登出(storage 事件)后的重新检查。
  useEffect(() => {
    if (!isLogin && !getAdminToken()) {
      router.replace(LOGIN_PATH);
    }
  }, [token, isLogin, router]);

  // 注册全局 401 处理：清登录态 + 提示 + 回登录页
  useEffect(() => {
    unauthorizedHandler = () => {
      clearAdminToken();
      clearAdminUsername();
      adminQueryClient.clear();
      MessagePlugin.warning("登录已过期，请重新登录");
      router.replace(LOGIN_PATH);
    };
    return () => {
      unauthorizedHandler = null;
    };
  }, [router]);

  return (
    <AdminUIProvider>
      <QueryClientProvider client={adminQueryClient}>
        {isLogin ? (
          <AdminChrome bare>{children}</AdminChrome>
        ) : token ? (
          <AuthedFrame>{children}</AuthedFrame>
        ) : (
          // 守卫未通过（正在跳登录页）或 SSR 首帧：不闪后台内容
          <AdminChrome bare>
            <div className="flex min-h-screen items-center justify-center">
              <Loading size="small" />
            </div>
          </AdminChrome>
        )}
      </QueryClientProvider>
    </AdminUIProvider>
  );
}

/** 登录通过后的框架挂载：取用户名、接退出，并给面包屑当前页标题 */
function AuthedFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 校验 token 并拿用户名（token 失效时由全局 401 处理踢回登录页）
  const { data: me } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: adminMe,
    retry: 0,
  });
  const username = me?.username || getAdminUsername() || "管理员";

  const onLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // 登出接口幂等；失败也照样本地清理（避免卡死在后台）
    } finally {
      clearAdminToken();
      clearAdminUsername();
      queryClient.clear();
      MessagePlugin.success("已退出登录");
      router.replace(LOGIN_PATH);
    }
  };

  // 面包屑标题：平铺一级 + 二级后按 pathname 精确匹配（分组父项仅作展开容器，不参与匹配跳转）
  const pageTitle = MENU_ITEMS.flatMap((item) => [item, ...(item.children ?? [])]).find(
    (item) => item.path === pathname,
  )?.label;

  return (
    <AdminChrome
      items={MENU_ITEMS}
      username={username}
      onLogout={onLogout}
      breadcrumb={pageTitle ? [pageTitle] : undefined}
    >
      {/* key 随路由变化重挂载，切页也重放一次「渐显上浮」（与官网区块观感同口径） */}
      <Reveal key={pathname}>{children}</Reveal>
    </AdminChrome>
  );
}
