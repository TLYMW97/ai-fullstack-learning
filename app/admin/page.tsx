import { prisma } from "@/lib/db";
import { deletePost } from "./actions";

// 后台文章管理页：/admin
// 列出全部文章（含草稿），每条带「编辑」链接和「删除」按钮。
// 「删除」是一个提交到 deletePost（Server Action）的表单——不需要写任何 API。
export default async function AdminIndex() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          文章管理
        </h1>
        <a
          href="/admin/new"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          写文章
        </a>
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-zinc-500">还没有文章。</p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between py-3">
              <div className="flex items-baseline gap-2">
                <a
                  href={`/posts/${post.id}`}
                  className="text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                >
                  {post.title}
                </a>
                <span
                  className={
                    post.published
                      ? "text-xs text-red-600"
                      : "text-xs text-zinc-400"
                  }
                >
                  {post.published ? "已发布" : "草稿"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <a
                  href={`/admin/${post.id}/edit`}
                  className="text-blue-600 transition-colors hover:underline"
                >
                  编辑
                </a>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={post.id} />
                  <button
                    type="submit"
                    className="text-red-600 transition-colors hover:underline"
                  >
                    删除
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
