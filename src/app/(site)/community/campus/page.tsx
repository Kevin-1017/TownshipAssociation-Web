import type { Metadata } from "next";
import CommunityBoard from "@/components/site/community/community-board";

export const metadata: Metadata = {
  title: "校园资讯",
};

/** 校园资讯：仅校园板块的动态流（列表 + 发布） */
export default function CommunityCampusPage() {
  return <CommunityBoard type="campus" />;
}
