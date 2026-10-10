"use client";

import { useMemo, useState } from "react";
import { LINEUPS, NADE_LABEL, type Lineup, type NadeKind } from "../lineups";

/** 道具类型 → 主题色（跟着 kevin.css 的变量走） */
const KIND_COLOR: Record<NadeKind, string> = {
  smoke: "var(--kv-soft)",
  flash: "var(--kv-warn)",
  molotov: "#f87171",
  decoy: "var(--kv-accent-2)",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`kevin-mono rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-[var(--kv-accent)] bg-[var(--kv-accent)] text-[var(--kv-bg)]"
          : "border-[var(--kv-line)] text-[var(--kv-soft)] hover:text-[var(--kv-fg)]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 道具列表浏览器：地图页签 × 道具类型过滤，条目默认收起、点开看步骤。
 * 纯前端过滤，静态导出无压力。
 */
export default function LineupBrowser() {
  const maps = useMemo(
    () => ["全部", ...Array.from(new Set(LINEUPS.map((l) => l.map)))],
    [],
  );
  const kinds = useMemo(
    () => ["全部", ...(Object.keys(NADE_LABEL) as NadeKind[])] as const,
    [],
  );

  const [map, setMap] = useState("全部");
  const [kind, setKind] = useState<string>("全部");

  const list = LINEUPS.filter(
    (l) => (map === "全部" || l.map === map) && (kind === "全部" || l.kind === kind),
  );

  // 按 地图 › 点位 分组渲染
  const grouped = list.reduce<Record<string, Lineup[]>>((acc, l) => {
    const key = `${l.map} · ${l.site}`;
    (acc[key] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {maps.map((m) => (
          <Chip key={m} active={map === m} onClick={() => setMap(m)}>
            {m}
          </Chip>
        ))}
        <span className="mx-1 text-[var(--kv-line)]">|</span>
        {kinds.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {k === "全部" ? "全部道具" : NADE_LABEL[k as NadeKind]}
          </Chip>
        ))}
      </div>

      {list.length === 0 && (
        <p className="kevin-mono mt-8 text-sm text-[var(--kv-soft)]">
          这个组合还没记 —— 回游戏丢一发再来补。
        </p>
      )}

      {Object.entries(grouped).map(([key, items]) => (
        <section key={key} className="mt-8">
          <h3 className="kevin-mono text-xs tracking-widest text-[var(--kv-soft)]">{key}</h3>
          <div className="mt-3 space-y-3">
            {items.map((l) => (
              <details
                key={`${l.map}-${l.name}`}
                className="group rounded-xl border border-[var(--kv-line)] bg-[var(--kv-bg-2)] px-4 py-3 open:pb-4"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 text-sm">
                  <span
                    className="kevin-mono shrink-0 rounded px-1.5 py-0.5 text-[11px]"
                    style={{ color: KIND_COLOR[l.kind], border: `1px solid ${KIND_COLOR[l.kind]}` }}
                  >
                    {NADE_LABEL[l.kind]}
                  </span>
                  <span className="font-medium">{l.name}</span>
                  <span className="kevin-mono ml-auto shrink-0 text-xs text-[var(--kv-soft)]">
                    {l.style}
                  </span>
                  <span aria-hidden className="text-[var(--kv-soft)] group-open:rotate-90 transition-transform">
                    ›
                  </span>
                </summary>
                <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm leading-[1.8] text-[var(--kv-soft)]">
                  {l.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {l.note && (
                  <p className="mt-2 border-l-2 border-[var(--kv-warn)] pl-3 text-xs text-[var(--kv-soft)]">
                    {l.note}
                  </p>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
