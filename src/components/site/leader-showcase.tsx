"use client";

import { useState } from "react";
import { Swiper } from "tdesign-react";
import { SectionHead } from "@/components/site/parts";

/**
 * TDesign 按需样式:swiper 规则表(.t-swiper*,只消费变量)不定义 --td-*,
 * 须连 token 层(es/style/index.css 的 :root)一起引入。二者都只挂在
 * 首页路由的构建产物上,不进 admin 组,也不进 site 其余页面。
 */
import "tdesign-react/es/style/index.css";
import "tdesign-react/es/swiper/style/css.js";

const { SwiperItem } = Swiper;

/** 负责人风采条目 —— 与小程序首页契约一致:仅展示用,不接口化 */
interface LeaderShowcase {
  name: string;
  role: string;
}

/**
 * 与小程序 tsa-miniprogram/src/pages/index/index.vue 的 LEADERS 同源。
 * 照片素材未到位,先用「姓氏首字头像」兜底(品牌渐变底,同小程序头像策略);
 * 换照片/接口化时改这里即可。
 */
const LEADERS: LeaderShowcase[] = [
  { name: "谢锐丹", role: "龙洞乡会会长" },
  { name: "沈娟", role: "龙洞乡会副会长" },
  { name: "郭纯琪", role: "龙洞乡会副会长" },
  { name: "苏强忠", role: "龙洞乡会基金会负责人" },
  { name: "卢强泽", role: "龙洞乡会负责人" },
  { name: "萧婷晓", role: "大学城乡会会长" },
  { name: "方家文", role: "大学城乡会副会长" },
  { name: "张培爱", role: "大学城乡会副会长" },
  { name: "江宏华", role: "大学城乡会基金会负责人" },
  { name: "许嘉婷", role: "大学城乡会负责人" },
];

/** 自动播放间隔(与小程序 swiper interval 一致) */
const AUTOPLAY_MS = 4000;

/**
 * 负责人风采:TDesign Swiper 卡片模式(居中一张、两侧缩进露边),
 * 观感对齐小程序首页 swiper(circular→loop 默认开、4s 自动播、
 * 指示条内置、字幕条随当前项联动)。
 * 静态导出下 card 模式必须显式传 height(组件量宽只在挂载后进行,
 * 首帧无内容撑高会塌陷);全部滑片常驻 DOM(台下项仅 transform 停放),
 * 姓名职务另以 sr-only 入卡,首屏 HTML 内容完整,不伤 SEO。
 */
export default function LeaderShowcaseSection() {
  // 字幕跟随当前项:Swiper 非受控(defaultCurrent=0),onChange 只用于回写展示
  const [current, setCurrent] = useState(0);
  const leader = LEADERS[current];

  return (
    <section aria-labelledby="home-leaders-title">
      <SectionHead
        id="home-leaders-title"
        title="负责人风采"
        subtitle="各乡镇校友会负责人一览"
      />
      <Swiper
        type="card"
        height={280}
        interval={AUTOPLAY_MS}
        trigger="click"
        aria-label="负责人风采轮播"
        onChange={(i) => setCurrent(i)}
      >
        {LEADERS.map((l) => (
          <SwiperItem key={l.name}>
            <div className="site-leader-photo">
              <span className="sr-only">
                {l.name} {l.role}
              </span>
              <span className="site-leader-initial site-display" aria-hidden>
                {l.name.slice(0, 1)}
              </span>
            </div>
          </SwiperItem>
        ))}
      </Swiper>
      <div
        className="site-card mx-auto mt-4 flex max-w-sm items-baseline justify-center gap-3 px-6 py-3"
        aria-live="polite"
      >
        <span className="site-display text-base font-semibold">{leader.name}</span>
        <span className="t-sub text-sm">{leader.role}</span>
      </div>
    </section>
  );
}
