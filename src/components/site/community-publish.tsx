"use client";

import { useEffect, useState } from "react";
import { COMMUNITY_REGIONS, CUISINE_OPTIONS, publishCommunityPost } from "@/lib/site-api";
import type { CommunityPostSaveRequest, CommunityPostType } from "@/lib/types";

/**
 * 发布动态弹窗（对应小程序 publish-campus / publish-food 两页的表单）。
 * 校验口径与后端 CommunityPostSaveRequest 一致：标题 5~30 字、内容 ≥10 字、昵称 ≤32 字。
 * 一期无登录，昵称为表单自由填（小程序取自用户资料，web 端无用户体系故显式填写）。
 * 图片不做上传：小程序侧也只存临时路径、从未接上传服务，接口 images 传空数组。
 * 由父级条件挂载：关闭即卸载，重开自然是干净初始态（effect 里不再同步重置）。
 */
export default function CommunityPublishDialog({
  defaultType,
  onClose,
  onPublished,
}: {
  /** 打开时预选的栏目（跟随列表页当前 tab） */
  defaultType: CommunityPostType;
  onClose: () => void;
  /** 发布成功后回调（列表页据此重新拉第一页） */
  onPublished: () => void;
}) {
  const [type, setType] = useState<CommunityPostType>(defaultType);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    const nick = author.trim();
    const t = title.trim();
    const c = content.trim();
    if (!nick) return setErr("请填写发布者昵称");
    if (t.length < 5 || t.length > 30) return setErr("标题需 5~30 个字");
    if (c.length < 10) return setErr("内容至少 10 个字");
    if (c.length > 1000) return setErr("内容最长 1000 个字");
    setSubmitting(true);
    setErr(null);
    const body: CommunityPostSaveRequest = {
      type,
      author: nick,
      title: t,
      content: c,
      images: [],
      ...(type === "food" ? { cuisine: cuisine || null, region: region || null } : {}),
    };
    try {
      await publishCommunityPost(body);
      // 成功后直接关闭：组件随即被父级卸载，草稿无需逐项清空
      onPublished();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error && e.message ? e.message : "发布失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(19, 41, 79, 0.45)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="site-card max-h-[88vh] w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="发布动态"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="site-display text-lg font-bold">发布动态</h2>
          <button
            type="button"
            className="t-sub text-xl leading-none"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="t-soft mb-1.5 text-sm font-medium">栏目</p>
            <div className="flex gap-1.5">
              {(
                [
                  { key: "food" as const, label: "美食基地" },
                  { key: "campus" as const, label: "校园广场" },
                ] satisfies { key: CommunityPostType; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`site-filterchip${type === t.key ? " site-filterchip--on" : ""}`}
                  onClick={() => setType(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="t-soft mb-1.5 block text-sm font-medium">
              昵称<i className="not-italic text-red-500"> *</i>
            </span>
            <input
              className="site-input"
              maxLength={32}
              placeholder="发布者昵称，≤32 字"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="t-soft mb-1.5 block text-sm font-medium">
              标题<i className="not-italic text-red-500"> *</i>
            </span>
            <input
              className="site-input"
              placeholder="5~30 字，一句话说清主题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="t-soft mb-1.5 block text-sm font-medium">
              内容<i className="not-italic text-red-500"> *</i>
            </span>
            <textarea
              className="site-textarea"
              rows={5}
              maxLength={1000}
              placeholder="至少 10 字：发生了什么、有什么想说的"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>

          {/* 美食专属字段（与后端 cuisine/region 口径一致，选填） */}
          {type === "food" ? (
            <>
              <div>
                <p className="t-soft mb-1.5 text-sm font-medium">菜系（选填）</p>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINE_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`site-filterchip${cuisine === c ? " site-filterchip--on" : ""}`}
                      onClick={() => setCuisine(cuisine === c ? "" : c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="t-soft mb-1.5 text-sm font-medium">地区（选填）</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMUNITY_REGIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      className={`site-filterchip${region === r.value ? " site-filterchip--on" : ""}`}
                      onClick={() => setRegion(region === r.value ? "" : r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {err ? (
            <p className="text-sm" style={{ color: "#c93756" }} role="alert">
              {err}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="site-btn site-btn--ghost" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="site-btn site-btn--primary"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? "发布中…" : "发布"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
