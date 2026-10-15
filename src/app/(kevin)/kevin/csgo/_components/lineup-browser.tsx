"use client";

import { useEffect, useMemo, useState } from "react";
import { useAsyncData } from "@/components/site/shared/use-async-data";
import { buildFileUrl } from "@/lib/api";
import { NADE_LABEL } from "@/lib/lineups";
import { fetchLineups } from "@/lib/site-api";
import type { Lineup, NadeKind } from "@/lib/types";

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
 * 道具列表浏览器：地图页签 × 道具类型过滤，条目默认收起、点开看步骤与截图。
 * 数据来自后端 GET /tsa/lineups（管理端 /admin/lineups 配置）——静态导出页在浏览器
 * 运行时拉取；取数失败给重试出口，不回退打样数据（单一数据源，避免误导）。
 */
export default function LineupBrowser() {
  const { state, reload } = useAsyncData(fetchLineups);
  // 就绪前的空数组同样要稳定引用（进 maps 的 useMemo 依赖），故一并 memo
  const all = useMemo(
    () => (state.status === "ready" ? (state.data ?? []) : []),
    [state.status, state.data],
  );

  const maps = useMemo(
    () => ["全部", ...Array.from(new Set(all.map((l) => l.map)))],
    [all],
  );
  const kinds = useMemo(
    () => ["全部", ...(Object.keys(NADE_LABEL) as NadeKind[])] as const,
    [],
  );

  const [map, setMap] = useState("全部");
  const [kind, setKind] = useState<string>("全部");
  // 截图灯箱：存打开中的图 URL（null=关）。不新开窗口，原地预览。
  const [preview, setPreview] = useState<string | null>(null);

  // 灯箱开着时：Esc 关闭 + 锁页面滚动（关灯箱自动还原）
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [preview]);

  const list = all.filter(
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
      {state.status === "loading" && (
        <p className="kevin-mono mt-8 text-sm text-[var(--kv-soft)]">载入点位…</p>
      )}

      {state.status === "error" && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="kevin-mono text-sm text-[var(--kv-warn)]">
            点位没拉到：{state.error ?? "未知错误"}
          </p>
          <Chip active={false} onClick={reload}>
            重试
          </Chip>
        </div>
      )}

      {state.status === "ready" && (
        <>
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

          {all.length === 0 && (
            <p className="kevin-mono mt-8 text-sm text-[var(--kv-soft)]">
              后台还没配置点位 —— 去 admin「CS 道具点位」记第一条。
            </p>
          )}

          {all.length > 0 && list.length === 0 && (
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
                    key={l.id}
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
                      {l.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                    {l.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {l.images.map((img, i) => {
                          const url = buildFileUrl(img);
                          if (!url) return null;
                          return (
                            <button
                              key={`${img}-${i}`}
                              type="button"
                              onClick={() => setPreview(url)}
                              title="点击预览大图"
                              className="block cursor-zoom-in rounded-lg"
                            >
                              <img
                                src={url}
                                alt={`${l.name} 截图${i + 1}`}
                                loading="lazy"
                                className="h-24 w-40 rounded-lg border border-[var(--kv-line)] object-cover opacity-90 transition-opacity hover:opacity-100"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
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
        </>
      )}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="截图预览"
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            alt="点位截图大图"
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />
          <button
            type="button"
            aria-label="关闭预览"
            onClick={() => setPreview(null)}
            className="kevin-mono absolute right-4 top-4 rounded-full border border-[var(--kv-line)] bg-[var(--kv-bg-2)] px-3 py-1 text-sm text-[var(--kv-soft)] hover:text-[var(--kv-fg)]"
          >
            ✕ 关闭
          </button>
        </div>
      )}
    </div>
  );
}
