import type { Metadata } from "next";
import EventsBoard from "@/components/site/events/events-board";

export const metadata: Metadata = {
  title: "乡会事件",
};

/** 乡会事件列表：支持按年份筛选 */
export default function EventsPage() {
  return <EventsBoard />;
}
