import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getPublishedPosts } from "@/lib/posts";

// 站点地图：搜索引擎据此发现所有公开页面。Next 约定文件，自动暴露为 /sitemap.xml。
// 只收录「已发布」文章；草稿不公开，自然也不进 sitemap。
//
// 必须动态渲染：CI 构建机没有数据库，构建期预渲染会直接报 DATABASE_URL 未设置。
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...posts.map((p) => ({
      url: `${site.url}/posts/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
