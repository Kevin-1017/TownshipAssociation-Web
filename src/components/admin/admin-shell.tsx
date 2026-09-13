"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Button, Layout, Loading, Menu, MessagePlugin, Space } from "tdesign-react";
import {
  clearAdminToken,
  clearAdminUsername,
  getAdminToken,
  getAdminUsername,
  subscribeAdminAuth,
} from "@/lib/admin-auth";
import { adminLogout, adminMe, isUnauthorizedError } from "@/lib/admin-api";

const LOGIN_PATH = "/admin/login";
const { Header, Content, Aside } = Layout;

/** 侧边菜单：value 直接用路由路径，与 pathname 一一对应 */
const MENU_ITEMS = [
  { path: "/admin", label: "工作台" },
  { path: "/admin/categories", label: "奖项类别" },
  { path: "/admin/records", label: "获奖记录" },
  { path: "/admin/donations", label: "捐赠鸣谢" },
  { path: "/admin/notices", label: "公告管理" },
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
 * 管理后台外壳：QueryClientProvider + 登录守卫 + TDesign Layout/Menu。
 * /admin/login 也在本 layout 之下（组内路由），故登录页只套 Provider、不套框架。
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === LOGIN_PATH;

  // localStorage 读取走外部订阅：水合阶段用 getNullToken，避免 SSR 快照不一致
  const token = useSyncExternalStore(subscribeAdminAuth, getAdminToken, getNullToken);

  // 无 token 访问业务页 → 回登录页
  useEffect(() => {
    if (!token && !isLogin) {
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
    <QueryClientProvider client={adminQueryClient}>
      {isLogin ? (
        <>{children}</>
      ) : token ? (
        <AdminFrame>{children}</AdminFrame>
      ) : (
        // 守卫未通过（正在跳登录页）或 SSR 首帧：不闪后台内容
        <div className="flex min-h-screen items-center justify-center">
          <Loading size="small" />
        </div>
      )}
    </QueryClientProvider>
  );
}

/** 后台框架：顶栏（用户名 + 退出）+ 侧栏菜单 + 内容区 */
function AdminFrame({ children }: { children: React.ReactNode }) {
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

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="text-base font-semibold">广工胶己人 · 管理后台</div>
        <Space size="middle">
          <span className="text-sm text-gray-600">{username}</span>
          <Button variant="text" size="small" onClick={onLogout}>
            退出登录
          </Button>
        </Space>
      </Header>
      <Layout className="bg-gray-50">
        <Aside width="200px" className="border-r border-gray-200 bg-white">
          <Menu value={pathname} onChange={(v) => router.push(String(v))} theme="light">
            {MENU_ITEMS.map((item) => (
              <Menu.MenuItem key={item.path} value={item.path}>
                {item.label}
              </Menu.MenuItem>
            ))}
          </Menu>
        </Aside>
        <Content className="p-6">{children}</Content>
      </Layout>
    </Layout>
  );
}
