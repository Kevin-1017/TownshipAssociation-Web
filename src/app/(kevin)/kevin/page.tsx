import Link from "next/link";
import Reveal from "@/components/site/shared/reveal";
import TiltCard from "@/components/kevin/tilt-card";
import Typewriter from "@/components/kevin/typewriter";

/**
 * Kevin 个人主页 —— 想改文案直接改下面这几个常量。
 * 2026-11 与简历同步：教育 / 实习 / 项目 / 技术栈。
 * 口径：项目只两张卡 —— 广工胶己人（作品直链线上官网）与农产品产销智能决策系统；
 * CS 道具指南属爱好性质，单独在"一些别的"区块给入口；页面不放"回乡会官网"类导航声明。
 */

const INTRO =
  "以前端为主方向，熟练运用 React / Vue 与跨端开发；" +
  "同时具备独立承担后端与部署的工程能力（Spring Boot / MySQL / Nginx），可完成从接口实现到线上交付的完整链路。";

const EDUCATION = { 
  school: "广东工业大学",
  major: "大数据管理与应用 · 本科",
  period: "2022.09 – 2026.07",
};

const INTERNSHIPS = [
  {
    org: "北京天源迪科网络科技",
    role: "前端开发实习生",
    period: "2025.11 – 2026.04",
    points: [
      "低代码可视化大屏：HookJS 编写自定义交互逻辑，ECharts 做图表可视化配置，跟完版本管理与发布流程",
      "AI 智能问答助手：流式响应、上下文会话管理、可拖拽悬浮窗交互",
      "Prettier 格式化 + ESLint 检查落地，整理代码规范与目录结构",
    ],
  },
  {
    org: "广州钛动科技",
    role: "前端开发实习生",
    period: "2025.04 – 2025.09",
    points: [
      "React 官网开发：六个页面、多域名匹配不同站点，封装可复用组件提效",
      "Rsbuild 构建重构：图片压缩、细化第三方分包、去重复包，首屏产物 13.7MB → 1.77MB，加载效率平均提升 70%",
      "构建期注入唯一版本戳，打包后自动刷新浏览器缓存",
    ],
  },
];

type Project = {
  name: string;
  desc: string;
  tech: string[];
  /** 外链指项目线上站点或仓库；站内页（如 /kevin/csgo）以 / 开头 */
  href?: string;
};

const PROJECTS: Project[] = [
  {
    name: "广工胶己人 · 乡会信息平台",
    desc: "校友会信息平台全栈：官网（Next.js 静态导出 + Tailwind，公告/活动/基金会数据与管理端审核流）、Spring Boot API、微信小程序三端一体，GitHub Actions 审批流部署。",
    tech: ["Next.js", "Spring Boot", "MySQL", "微信小程序"],
    href: "https://www.gdutgaginang.cn",
  },
  {
    name: "农产品产销智能决策系统",
    desc: "面向农户/采购商的产销对接平台：实时行情、价格预测、风险预警。设计 12 维特征向量，PyTorch 训练 MLP 模型，经 ONNX Runtime 在 Node.js 端实时推理；TypeORM 持久化 + 联合索引优化查询。",
    tech: ["Taro 4", "React 18", "TypeScript", "NestJS 11", "MySQL 8", "Kafka", "ONNX", "Playwright"],
  },
];

const SKILLS = [
  "JavaScript / ES6",
  "TypeScript",
  "HTML5 / CSS3",
  "React（Hooks · Redux Toolkit / Zustand）",
  "Vue 3（Vue-Router · Pinia）",
  "Taro / Uni-app / 微信小程序",
  "Ant Design / ElementUI / Vant",
  "Next.js / Tailwind CSS",
  "Node.js / NestJS",
  "MySQL / TypeORM",
  "Webpack / Vite / Rsbuild",
  "HTTP / 浏览器渲染 / 性能优化",
  "Git / GitHub Actions",
  "Claude Code / Skills / MCP（AI 辅助研发与代码审查）",
];

const CONTACTS = [
  { label: "GitHub", href: "https://github.com/Kevin-1017", hint: "@Kevin-1017" },
  { label: "邮箱", href: "mailto:13623034184@163.com", hint: "13623034184@163.com" },
];

/** 项目卡：有 href 就整体可点——站内用 Link，站外新窗口；无 href 则纯展示。 */
function ProjectCard({ p }: { p: Project }) {
  const body = (
    <>
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
    </>
  );
  if (!p.href) return body;
  return p.href.startsWith("/") ? (
    <Link href={p.href} className="block h-full">
      {body}
    </Link>
  ) : (
    <a href={p.href} target="_blank" rel="noreferrer" className="block h-full">
      {body}
    </a>
  );
}

export default function KevinPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      {/* ---- 自我介绍 ---- */}
      <section className="pt-14 pb-4 sm:pt-20">
        <h1 className="kevin-mono text-3xl font-bold sm:text-4xl">
          <Typewriter />
        </h1>
        <p className="mt-5 max-w-xl leading-[1.9] text-[var(--kv-soft)]">{INTRO}</p>
        <p className="kevin-mono mt-4 text-xs leading-[1.9] text-[var(--kv-soft)]">
          {EDUCATION.school} · {EDUCATION.major} · {EDUCATION.period}
        </p>
      </section>

      {/* ---- 实习经历 ---- */}
      <section className="py-10">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-accent)]">
          ## 实习经历
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {INTERNSHIPS.map((x, i) => (
            <Reveal key={x.org} delay={i * 90}>
              <TiltCard>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{x.org}</h3>
                  <span className="kevin-mono text-xs text-[var(--kv-soft)]">{x.period}</span>
                </div>
                <p className="kevin-mono mt-1 text-xs text-[var(--kv-accent-2)]">{x.role}</p>
                <ul className="mt-3 space-y-2 text-sm leading-[1.8] text-[var(--kv-soft)]">
                  {x.points.map((p) => (
                    <li key={p} className="list-disc pl-4 marker:text-[var(--kv-line)]">
                      {p}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- 项目展示 ---- */}
      <section className="py-10">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-accent)]">
          ## 项目
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <TiltCard>
                <ProjectCard p={p} />
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

      {/* ---- CS:GO 道具指南入口（爱好性质，不算项目卡） ---- */}
      <section className="py-10">
        <h2 className="kevin-mono text-sm tracking-widest text-[var(--kv-warn)]">
          ## 一些别的
        </h2>
        <Reveal>
          <TiltCard className="mt-5">
            <Link href="/kevin/csgo" className="block">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">CS2 道具指南</h3>
                <span className="kevin-mono text-xs text-[var(--kv-soft)]">
                  →
                </span>
              </div>
              <p className="mt-2 text-sm leading-[1.8] text-[var(--kv-soft)]">
                按地图整理的烟雾 / 闪光 / 火弹投掷点位笔记
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
      </section>
    </div>
  );
}
