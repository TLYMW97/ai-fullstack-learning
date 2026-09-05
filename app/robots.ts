import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// robots.txt：告诉搜索引擎哪些能抓、哪些不能。Next 约定文件，自动暴露为 /robots.txt。
// /admin 和 /login 是后台/鉴权，禁止抓取；其余公开。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
