import { Suspense } from "react";
import type { Metadata } from "next";
import { ListSkeleton } from "@/components/site/shared/state-blocks";
import FoundationBoard from "@/components/site/foundation/foundation-board";

export const metadata: Metadata = {
  title: "校友基金会",
};

/** 页面壳：静态导出下 ?tab= 深链由客户端解析，useSearchParams 必须包 Suspense；正文板块见 FoundationBoard。 */
export default function FoundationPage() {
  return (
    <Suspense fallback={<div className="site-container pt-10"><ListSkeleton rows={5} /></div>}>
      <FoundationBoard />
    </Suspense>
  );
}
