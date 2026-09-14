import type { Metadata } from "next";
import EventsBoard from "@/components/site/events-board";

export const metadata: Metadata = {
  title: "乡会事件",
};

/** 乡会事件列表：对应小程序 event/list（tab 页「事件」），支持按年份筛选 */
export default function EventsPage() {
  return <EventsBoard />;
}
