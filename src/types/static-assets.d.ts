/**
 * 静态资源导入的类型声明：Next 自带类型只覆盖 *.css/*.module.css，
 * 后台移植组件需以 URL 字符串方式导入 svg/png(Turbopack 原生支持)。
 */
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}
