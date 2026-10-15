import type { Metadata } from "next";
import Link from "next/link";
import LineupBrowser from "./_components/lineup-browser";

export const metadata: Metadata = {
  title: "CS 道具指南",
};

/** CS:GO / CS2 道具笔记：点位/步骤/截图都在管理后台配置，数据走 GET /tsa/lineups */
export default function CsgoPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <section className="pt-12 pb-2">
        <Link href="/kevin" className="kevin-mono text-xs text-[var(--kv-soft)] hover:text-[var(--kv-accent)]">
          ← 回主页
        </Link>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">CS 道具指南</h1>
        <p className="mt-3 max-w-xl text-sm leading-[1.9] text-[var(--kv-soft)]">
          我自己的投掷笔记：只记实战丢得进去的点位。内容（含截图与分步说明）在管理后台
          <code className="kevin-mono text-[var(--kv-accent)]">「CS 道具点位」</code>
          配置，这里打开即是最新的。
        </p>
      </section>

      <div className="pb-16">
        <LineupBrowser />
      </div>
    </div>
  );
}
