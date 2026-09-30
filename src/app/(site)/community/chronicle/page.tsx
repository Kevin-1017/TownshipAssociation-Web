import type { Metadata } from "next";
import CommunityChronicle from "@/components/site/community/community-chronicle";

export const metadata: Metadata = {
  title: "乡会流年志",
};

/** 乡会流年志：官方编年史时间线 */
export default function CommunityChroniclePage() {
  return <CommunityChronicle />;
}
