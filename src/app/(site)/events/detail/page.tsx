import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/site/state-blocks";
import EventDetail from "./event-detail";

export const metadata: Metadata = {
  title: "事件详情",
};

/**
 * 乡会事件详情：静态导出下 ?id= 由客户端解析，useSearchParams 必须包 Suspense
 * （与公告 / 动态详情同款做法）。
 */
export default function EventDetailPage() {
  return (
    <div className="site-container py-6 sm:py-10">
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <EventDetail />
      </Suspense>
    </div>
  );
}
