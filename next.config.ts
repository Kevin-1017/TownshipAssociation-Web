import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：npm run build 产出 out/，整体上传 Nginx，/tsa 由 Nginx 反代 8080
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
