import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/site/state-blocks";
import PostDetail from "./post-detail";

export const metadata: Metadata = {
  title: "动态详情",
};

/**
 * 社区动态详情：小程序侧此页是占位，但后端详情/点赞/评论契约早已就绪且公网可用，
 * web 端一次做全。静态导出下 ?id= 由客户端解析，useSearchParams 必须包 Suspense。
 */
export default function CommunityPostDetailPage() {
  return (
    <div className="site-container py-6 sm:py-10">
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <PostDetail />
      </Suspense>
    </div>
  );
}
