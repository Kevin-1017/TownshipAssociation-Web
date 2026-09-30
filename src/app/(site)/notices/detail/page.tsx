import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/site/shared/state-blocks";
import NoticeDetail from "./notice-detail";

export const metadata: Metadata = {
  title: "公告详情",
};

/** 静态导出下详情页只出一份 HTML，?id=xxx 由客户端解析取数；useSearchParams 必须包 Suspense */
export default function NoticeDetailPage() {
  return (
    <div className="site-container py-6 sm:py-10">
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <NoticeDetail />
      </Suspense>
    </div>
  );
}
