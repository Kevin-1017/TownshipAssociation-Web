"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "tdesign-react";
import { CloseIcon } from "tdesign-icons-react";
import { buildFileUrl, uploadImage } from "@/lib/api";
import { COMMUNITY_REGIONS, CUISINE_OPTIONS, publishCommunityPost } from "@/lib/site-api";
import type { CommunityPostSaveRequest, CommunityPostType } from "@/lib/types";

/**
 * 发布动态弹窗（对应小程序 publish-campus / publish-food 两页的表单）。
 * 栏目由所在页面定死（food 页发美食、campus 页发校园），弹窗内不做切换。
 * 校验口径与后端 CommunityPostSaveRequest 一致：标题 5~30 字、内容 ≥10 字、昵称 ≤32 字。
 * 一期无登录，昵称为表单自由填（小程序取自用户资料，web 端无用户体系故显式填写）。
 * 2026-09-14 审核制：发布落待审、后台过审后才上列表；配图最多 1 张，
 * 选图即传公开上传端点（/tsa/community/uploads），发布时只带服务端返回的相对路径。
 * 由父级条件挂载：关闭即卸载，重开自然是干净初始态（effect 里不再同步重置）。
 */
export default function CommunityPublishDialog({
  type,
  onClose,
  onPublished,
}: {
  /** 发布去向的栏目 —— 由列表页所在板块直接给定 */
  type: CommunityPostType;
  onClose: () => void;
  /** 发布成功后回调（列表页据此重新拉第一页） */
  onPublished: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // 配图（最多 1 张）：选图即传 → imagePath 存服务端相对路径；done 切换成功视图
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** 选图即传：先本地粗闸（类型/2MB），再交服务端复检（口径见 UploadRules） */
  const pickImage = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErr("图片仅支持 jpg / png / webp");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErr("图片不能超过 2MB");
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const r = await uploadImage("/tsa/community/uploads", file);
      setImagePath(r.path);
    } catch (e: unknown) {
      setErr(e instanceof Error && e.message ? e.message : "图片上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    const nick = author.trim();
    const t = title.trim();
    const c = content.trim();
    if (!nick) return setErr("请填写发布者昵称");
    if (t.length < 5 || t.length > 30) return setErr("标题需 5~30 个字");
    if (c.length < 10) return setErr("内容至少 10 个字");
    if (c.length > 1000) return setErr("内容最长 1000 个字");
    if (uploading) return setErr("图片上传中，请稍候再提交");
    setSubmitting(true);
    setErr(null);
    const body: CommunityPostSaveRequest = {
      type,
      author: nick,
      title: t,
      content: c,
      images: imagePath ? [imagePath] : [],
      ...(type === "food" ? { cuisine: cuisine || null, region: region || null } : {}),
    };
    try {
      await publishCommunityPost(body);
      // 审核制：帖子落待审不会立刻出现在列表 —— 切成功视图告知用户，列表刷新照常触发
      onPublished();
      setDone(true);
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
          <Button shape="circle" variant="text"   onClick={onClose}>
            <CloseIcon fillColor="transparent" strokeColor="currentColor" strokeWidth={2} />
          </Button>
        </div>

        {done ? (
          <div className="pt-8 pb-4 text-center">
            <p className="site-display text-4xl" style={{ color: "var(--brand)" }} aria-hidden>
              ✔
            </p>
            <h3 className="site-display mt-3 text-lg font-bold">已提交，等待审核</h3>
            <p className="t-sub mx-auto mt-2 max-w-[260px] text-sm">
              秘书处审核通过后，内容会展示在{type === "food" ? "美食基地" : "校园广场"}栏目中，感谢分享。
            </p>
            <button type="button" className="site-btn site-btn--primary mt-6" onClick={onClose}>
              好的
            </button>
          </div>
        ) : (
        <div className="mt-4 space-y-4">
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

          {/* 配图：最多 1 张，选图即传，服务端回相对路径；预览走 buildFileUrl 拼域名 */}
          <div>
            <p className="t-soft mb-1.5 text-sm font-medium">配图（选填 · 最多 1 张 · jpg/png/webp ≤2MB）</p>
            {imagePath ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildFileUrl(imagePath) ?? undefined}
                  alt="配图预览"
                  className="h-24 w-24 rounded-xl border border-[var(--line)] object-cover"
                />
                <button
                  type="button"
                  className="site-btn site-btn--ghost !text-xs"
                  onClick={() => setImagePath(null)}
                >
                  移除图片
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="site-btn site-btn--ghost !text-xs"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "上传中…" : "选择图片"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickImage(f);
              }}
            />
          </div>

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
        )}
      </div>
    </div>
  );
}
