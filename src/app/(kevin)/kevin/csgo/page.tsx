import type { Metadata } from "next";
import Link from "next/link";
import LineupBrowser from "@/components/kevin/lineup-browser";

export const metadata: Metadata = {
  title: "CS 道具指南",
};

/** CS:GO / CS2 道具笔记：点位名称/投掷方式/截图都在管理后台配置，数据走 GET /tsa/lineups */
export default function CsgoPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <section className="pt-12 pb-2">
        <Link href="/kevin" className="kevin-mono text-xs text-[var(--kv-soft)] hover:text-[var(--kv-accent)]">
          ← 回主页
        </Link>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">CS 道具指南</h1>
      </section>

      <div className="pb-16">
        <LineupBrowser />
      </div>
    </div>
  );
}
