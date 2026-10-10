import Link from "next/link";
import Reveal from "@/components/site/shared/reveal";
import TiltCard from "./_components/tilt-card";
import Typewriter from "./_components/typewriter";

/**
 * Kevin 个人主页 —— 想改文案直接改下面这几个常量。
 * 项目与 GitHub 仓库对应，占位邮箱/微信记得换成自己的。
 */

const PROJECTS = [
  {
    name: "广工胶己人 · 官网",
    desc: "校友会信息展示站：公告、活动、基金会数据。Next.js 16 静态导出 + Tailwind。",
    tech: ["Next.js", "TypeScript", "Tailwind"],
    href: "https://github.com/Kevin-1017/TownshipAssociation-Web",
  },
  {
    name: "广工胶己人 · 后端",
    desc: "Spring Boot API：权限、捐赠与奖励公示的业务接口，配合 Nginx 反代部署。",
    tech: ["Java", "Spring Boot", "MySQL"],
    href: "https://github.com/Kevin-1017/TownshipAssociation-Api",
  },
  {
    name: "广工胶己人 · 小程序",
    desc: "微信小程序端，乡情活动与公告触达。",
    tech: ["小程序"],
    href: "https://github.com/Kevin-1017/TownshipAssociation-Miniprogram",
  },
];

const SKILLS = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Java",
  "Spring Boot",
  "MySQL",
  "微信小程序",
  "Git / GitHub Actions",
  "Linux / Nginx",
];

const CONTACTS = [
  { label: "GitHub", href: "https://github.com/Kevin-1017", hint: "@Kevin-1017" },
  // TODO: 换成你自己的公开邮箱
  { label: "邮箱", href: "mailto:you@example.com", hint: "you@example.com" },
];

export default function KevinPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      {/* ---- 自我介绍 ---- */}
      <section className="pt-14 pb-4 sm:pt-20">
        <h1 className="kevin-mono text-3xl font-bold sm:text-4xl">
          <Typewriter />
        </h1>
        <p className="mt-5 max-w-xl leading-[1.9] text-[var(--kv-soft)]">
          广东工业大学在读，潮阳潮南人。白天写 Spring Boot，晚上写 React，
          闲时打两把 CS —— 顺手把常丢的道具记成了下面的指南。
        </p>
      </section>

      {/* ---- 项目展示 ---- */}
      <section className="py-10">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-accent)]">
          ## 项目
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <TiltCard>
                <a href={p.href} target="_blank" rel="noreferrer" className="block h-full">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm leading-[1.8] text-[var(--kv-soft)]">{p.desc}</p>
                  <div className="kevin-mono mt-4 flex flex-wrap gap-1.5 text-[11px]">
                    {p.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[var(--kv-line)] px-2 py-0.5 text-[var(--kv-soft)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </a>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- 技术栈 ---- */}
      <section className="py-10">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-accent-2)]">
          ## 技术栈
        </h2>
        <div className="kevin-mono mt-5 flex flex-wrap gap-2 text-sm">
          {SKILLS.map((s) => (
            <span
              key={s}
              className="rounded-lg bg-[var(--kv-bg-2)] px-3 py-1.5 text-[var(--kv-soft)] transition-colors hover:text-[var(--kv-fg)]"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ---- CS:GO 道具指南入口 ---- */}
      <section className="py-10">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-warn)]">
          ## 一些别的
        </h2>
        <Reveal>
          <TiltCard className="mt-5">
            <Link href="/kevin/csgo" className="block">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">CS:GO / CS2 道具指南</h3>
                <span className="kevin-mono text-xs text-[var(--kv-soft)]">
                  我自己丢得进去的才算数 →
                </span>
              </div>
              <p className="mt-2 text-sm leading-[1.8] text-[var(--kv-soft)]">
                按地图整理的烟雾 / 闪光 / 火弹投掷点位笔记，边玩边补。
              </p>
            </Link>
          </TiltCard>
        </Reveal>
      </section>

      {/* ---- 联系方式 ---- */}
      <section className="py-10 pb-16">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-accent)]">
          ## 找我
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noreferrer"
              className="kevin-tilt rounded-xl border border-[var(--kv-line)] bg-[var(--kv-bg-2)] px-4 py-3 text-sm"
            >
              <span className="font-semibold">{c.label}</span>
              <span className="kevin-mono ml-2 text-[var(--kv-soft)]">{c.hint}</span>
            </a>
          ))}
        </div>
        <p className="kevin-mono mt-4 text-xs text-[var(--kv-soft)]">
          （小提示：这个页面藏了键盘彩蛋，试试乡会的缩写。）
        </p>
      </section>
    </div>
  );
}
