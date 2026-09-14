import type { Metadata } from "next";
import CommunityChronicle from "@/components/site/community-chronicle";

export const metadata: Metadata = {
  title: "乡会流年志",
};

/** 乡会流年志：官方编年史时间线（对应小程序 community/chronicle） */
export default function CommunityChroniclePage() {
  return <CommunityChronicle />;
}
