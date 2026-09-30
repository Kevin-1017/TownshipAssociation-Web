import Link from "next/link";
import { PageHead } from "@/components/site/shared/parts";
import type { LegalDocument } from "./documents";
import "./legal-doc.css";

/**
 * 法律文本渲染版式：页头 + 前言日期块 + 逐节正文。
 * 两个法务页共用（/legal/privacy、/legal/agreement）。
 */
export default function LegalDoc({ doc }: { doc: LegalDocument }) {
  const preface = doc.sections.find((s) => s.title === "");
  const body = doc.sections.filter((s) => s.title !== "");

  return (
    <div>
      <PageHead title={doc.title} subtitle="广东工业大学潮阳潮南校友会 · 广工胶己人" />

      <div className="site-container py-6 sm:py-10">
        <article className="site-card p-6 sm:p-9">
          {preface ? (
            <p
              className="t-soft whitespace-pre-line rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--brand-faint)" }}
            >
              {preface.body}
            </p>
          ) : null}

          <p className="t-soft mt-5 leading-[1.9]">{doc.intro}</p>

          <div className="site-prose mt-2">
            {body.map((section) => (
              <section key={section.title} className="mt-8">
                <h2 className="site-display">{section.title}</h2>
                <p className="mt-2.5 whitespace-pre-line text-[15px] leading-[2] sm:text-base">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-5 text-sm"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="t-sub">另请查阅：</span>
            <Link href="/legal/privacy" className="t-brand underline-offset-4 hover:underline">
              隐私保护指引
            </Link>
            <Link href="/legal/agreement" className="t-brand underline-offset-4 hover:underline">
              用户服务协议
            </Link>
            <Link
              href="/"
              className="t-soft ml-auto underline-offset-4 hover:underline"
            >
              返回首页
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
