import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/site/shared/parts";

export const metadata: Metadata = {
  title: "关于我们",
  description:
    "广工胶己人是广东工业大学潮阳潮南校友会的信息展示平台，展示公告通知、奖励表彰与捐赠鸣谢等公开信息。",
};

/**
 * 组织简介页 —— 静态文案，口径：信息展示、非经营性；
 * 不出现在线支付、募捐受理、用户发布内容等表述。
 */
export default function AboutPage() {
  return (
    <div>
      <PageHead
        title="关于我们"
        subtitle="广工胶己人 · 广东工业大学潮阳潮南校友会"
      />

      <div className="site-container space-y-6 pt-6 sm:pt-8">
        <section className="site-card p-6 sm:p-8">
          <h2 className="site-display text-lg font-bold sm:text-xl">我们是谁</h2>
          <p className="mt-3 leading-[1.9]">
            「广工胶己人」是广东工业大学潮阳潮南校友会的亲切称谓——「胶己人」，自己人。
            我们会由在广东工业大学学习、工作过的潮阳、潮南两地校友自愿结成，
            以乡情为纽带，在校友与家乡之间搭一座桥。
          </p>
          <p className="mt-3 leading-[1.9]">
            同是一方水土人，相逢异方倍亲切。我们会常态开展乡情联谊、奖教助学等公益事务，
            具体安排由乡会理事会与秘书处负责。
          </p>
        </section>

        <section className="site-card p-6 sm:p-8">
          <h2 className="site-display text-lg font-bold sm:text-xl">我们会做什么</h2>
          <ul className="mt-3 space-y-2.5 leading-[1.9]">
            <li className="flex gap-2.5">
              <span aria-hidden className="t-brand mt-px">·</span>
              <span>
                <strong className="font-semibold">公告通知</strong>
                —— 乡会会务与公开事项的通知，均在本网站「公告通知」栏目公布。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="t-brand mt-px">·</span>
              <span>
                <strong className="font-semibold">奖励与表彰</strong>
                —— 会同学校开展校内奖励项目的公示与获奖记录鸣谢。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="t-brand mt-px">·</span>
              <span>
                <strong className="font-semibold">捐赠与帮助致谢</strong>
                —— 对支持乡会与奖教助学事务的爱心捐赠和帮助公开致谢，金额以捐赠人意愿为准确定是否公示。
              </span>
            </li>
          </ul>
        </section>

        <section className="site-card p-6 sm:p-8">
          <h2 className="site-display text-lg font-bold sm:text-xl">关于本网站</h2>
          <p className="mt-3 leading-[1.9]">
            本网站是校友会的信息展示平台，属非经营性用途：只呈现由乡会秘书处整理的公开信息，
            不提供在线支付、募捐受理、账号登录或用户发布内容等服务，也不向浏览者收集个人信息。
            如需了解奖励与捐赠的更多细节，或对本网站内容有任何意见，欢迎通过下方方式与我们联系。
          </p>
          <div
            className="mt-5 rounded-2xl p-4 sm:p-5"
            style={{ backgroundColor: "var(--brand-faint)" }}
          >
            <p className="text-sm font-semibold">联系方式</p>
            <p className="t-soft mt-1 text-sm">
              邮箱：
              <a
                href="mailto:13623034184@163.com"
                className="t-brand underline underline-offset-4"
              >
                13623034184@163.com
              </a>
              （乡会秘书处收）
            </p>
          </div>
          <p className="t-sub mt-4 text-xs sm:text-sm">
            使用本网站即表示您已阅读并理解
            <Link href="/legal/privacy" className="t-brand mx-1 underline-offset-4 hover:underline">
              隐私保护指引
            </Link>
            与
            <Link href="/legal/agreement" className="t-brand mx-1 underline-offset-4 hover:underline">
              用户服务协议
            </Link>
            。
          </p>
        </section>
      </div>
    </div>
  );
}
