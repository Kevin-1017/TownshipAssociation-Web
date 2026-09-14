import type { Metadata } from "next";
import CommunityBoard from "@/components/site/community-board";

export const metadata: Metadata = {
  title: "校园资讯",
};

/** 校园资讯：仅校园板块的动态流（列表 + 发布；小程序「校园广场」的 web 承接页） */
export default function CommunityCampusPage() {
  return <CommunityBoard type="campus" />;
}
