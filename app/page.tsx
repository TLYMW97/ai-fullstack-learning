import { prisma } from "@/lib/db";

// 这是一个「服务端组件」（Server Component）。
// 关键：它是 async 函数，可以直接 await 查数据库——代码只在服务器上跑，
// 永远不会打进浏览器包里。所以数据库连接串、密码这些不会泄漏到前端。
//
// 对比传统写法：以前要写一个 /api/posts 接口，前端再 fetch 它。
// App Router 里服务端组件直接查库，省掉了这一层来回。
export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        AI 全栈学习博客
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        数据来自 Docker 里的 PostgreSQL 17，经 Prisma 读取
      </p>

      <a
        href="/admin/new"
        className="mt-6 inline-block rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        写文章
      </a>

      {posts.length === 0 ? (
        <p className="mt-10 text-zinc-500">还没有文章。</p>
      ) : (
        <ul className="mt-10 space-y-6">
          {posts.map((post) => (
            <li
              key={post.id}
              className="border-b border-zinc-200 pb-6 dark:border-zinc-800"
            >
              <h2 className="text-xl font-medium">
                <a
                  href={`/posts/${post.id}`}
                  className="text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                >
                  {post.title}
                </a>
              </h2>
              {post.content && (
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {post.content}
                </p>
              )}
              <div className="mt-3 flex gap-3 text-xs text-zinc-400">
                <span
                  className={
                    post.published ? "text-red-600" : "text-zinc-400"
                  }
                >
                  {post.published ? "已发布" : "草稿"}
                </span>
                <span>
                  {post.createdAt.toLocaleDateString("zh-CN", {
                    timeZone: "Asia/Shanghai",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
