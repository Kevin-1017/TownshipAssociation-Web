import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 本项目为静态导出(output:'export')且 images.unoptimized:true，next/image 不走优化器、
      // 渲染结果与原生 <img> 完全相同；动态用户图(事件封面/动态配图)外链域名不定、尺寸未知，
      // 换 Image 需 fill+定位容器却零收益。规则在本仓不适用；可转换的静态资源已直接用 Image。
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 官方 tdesign-react-starter 模板整份参考存档(仅备查,不参与构建/lint/类型检查)
    "src/tdesign-starter/**",
  ]),
]);

export default eslintConfig;
