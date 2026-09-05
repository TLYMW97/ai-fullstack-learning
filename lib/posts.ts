import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// 文章的数据访问层（data access layer）。
//
// 为什么单独抽一层：页面组件和 Server Action 不该直接 `prisma.post.*`——
// 那样 UI 和数据库耦合，查询散落各处、不好加索引也不好统一。这一层把所有
// "文章怎么查/怎么写" 收口到这里，UI 只调语义化函数。这也是 App Router 里
// "前后端分离" 的实际落点：Server Action / Route Handler 是接口，lib/posts
// 是业务逻辑与数据边界。
//
// 注意：这些都是薄封装，没有搞 repository 类 / 工厂（ponytail: 一个表一个
// 实现，上类纯属样板）。要加字段、加查询，直接在这里加函数。
// ---------------------------------------------------------------------------

export type PostInput = {
  title: string;
  content: string | null;
  published: boolean;
  tags: string[];
};

/** 公开列表的筛选条件 */
export type PostFilter = {
  tag?: string; // 按标签筛
  q?: string; // 标题关键词搜索
  page?: number; // 页码，从 1 开始
  pageSize?: number; // 每页条数
};

const PAGE_SIZE = 6;
export { PAGE_SIZE };

/** 公开首页：只取已发布，支持标签筛选 / 标题搜索 / 分页，按创建时间倒序 */
export function getPublishedPosts(filter: PostFilter = {}) {
  const { tag, q, page = 1, pageSize = PAGE_SIZE } = filter;

  const where = {
    published: true,
    ...(tag ? { tags: { has: tag } } : {}), // 标量列表的「包含某元素」筛选
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

/** 符合筛选条件的已发布文章总数（分页用） */
export function getPublishedPostsCount(
  filter: { tag?: string; q?: string } = {},
) {
  const { tag, q } = filter;
  return prisma.post.count({
    where: {
      published: true,
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
  });
}

/** 所有已发布文章的标签（去重 + 计数），按出现次数倒序 */
export async function getAllTags() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { tags: true },
  });
  // ponytail: 个人博客文章量小，直接在内存里聚合标签；要上 SQL 聚合时再说
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** 后台：全部文章（含草稿），按创建时间倒序 */
export function getAdminPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/** 详情页 / 编辑页：按 id 取一篇 */
export function getPostById(id: number) {
  return prisma.post.findUnique({ where: { id } });
}

/** 构建期预渲染：只取 id 列表 */
export function getPostIds() {
  return prisma.post.findMany({ select: { id: true } });
}

/** 详情页上一篇/下一篇：只取已发布，按创建时间倒序（草稿不该出现在公开导航里） */
export function getPostsOrdered() {
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export function createPost(input: PostInput) {
  return prisma.post.create({ data: input });
}

export function updatePost(id: number, input: PostInput) {
  return prisma.post.update({ where: { id }, data: input });
}

export function deletePost(id: number) {
  return prisma.post.delete({ where: { id } });
}
