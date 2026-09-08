import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 自包含构建：生成 .next/standalone（含精简 node_modules，与 build 时版本一致）。
  output: "standalone",

  // 服务端外部包（运行时 require，不打包）：仅 cos-nodejs-sdk-v5 需要
  // （CJS 依赖树 + 沙箱 junction 解析不兼容，P31）。
  serverExternalPackages: ["cos-nodejs-sdk-v5"],

  experimental: {
    // Server Action 请求体上限：默认 1MB，图片上传不够，放大到 10MB。
    // 注意：Next 15/16 里 bodySizeLimit 仍在 experimental 下。
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
