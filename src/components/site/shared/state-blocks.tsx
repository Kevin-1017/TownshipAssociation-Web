"use client";

/**
 * 官网共用的加载骨架 / 失败态 / 空态 —— 每页都要有，不白屏。
 */

import "./state-blocks.css";

export function SkeletonBar({
  width = "100%",
  height = 14,
}: {
  width?: string;
  height?: number;
}) {
  return <span className="site-skeleton" style={{ width, height }} />;
}

/** 列表卡片骨架：rows 行「主文字 + 副文字 + 右侧金额位」 */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="site-card site-divide overflow-hidden"
      role="status"
      aria-label="加载中"
      aria-live="polite"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 px-5 py-5 sm:px-6">
          <div className="min-w-0 flex-1 space-y-2.5">
            <SkeletonBar width="42%" height={16} />
            <SkeletonBar width="64%" height={11} />
          </div>
          <SkeletonBar width="64px" height={18} />
        </div>
      ))}
    </div>
  );
}

/** 失败态：展示后端/网络信息 + 重新加载按钮（口径：稍后重试） */
export function ErrorHint({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="site-card p-8 text-center sm:p-10" role="alert">
      <p className="site-display text-lg font-bold">数据加载失败</p>
      <p className="t-soft mt-1.5 text-sm">
        {message ? `${message}。` : ""}若网络正常仍提示失败，可能是乡会后台在维护，请稍后重试。
      </p>
      <button type="button" className="site-btn site-btn--primary mt-6" onClick={onRetry}>
        重新加载
      </button>
    </div>
  );
}

export function EmptyHint({ text }: { text: string }) {
  return (
    <div className="site-card px-6 py-12 text-center">
      <p className="t-sub text-sm">{text}</p>
    </div>
  );
}
