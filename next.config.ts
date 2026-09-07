import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 把 COS SDK 标记为服务端外部包：Turbopack 不打包它的依赖树，
  // 运行时由 Node 直接 require（COS SDK 有一大串 CJS 依赖，且沙箱里
  // junction + Turbopack 解析不兼容，Node require 反而能正常过）。
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
