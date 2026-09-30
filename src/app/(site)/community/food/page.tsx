import type { Metadata } from "next";
import CommunityBoard from "@/components/site/community/community-board";

export const metadata: Metadata = {
  title: "美食基地",
};

/** 美食基地：仅美食板块的动态流（列表 + 发布 + 筛选） */
export default function CommunityFoodPage() {
  return <CommunityBoard type="food" />;
}
