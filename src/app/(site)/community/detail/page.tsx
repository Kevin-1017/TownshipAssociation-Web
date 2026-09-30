import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/site/shared/state-blocks";
import PostDetail from "./post-detail";

export const metadata: Metadata = {
  title: "动态详情",
};

/** 社区动态详情：静态导出下 ?id= 由客户端解析，useSearchParams 必须包 Suspense。 */
export default function CommunityPostDetailPage() {
  return (
    <div className="site-container py-6 sm:py-10">
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <PostDetail />
      </Suspense>
    </div>
  );
}
