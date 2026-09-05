import { logout } from "./actions";
import { getAdminPosts } from "@/lib/posts";
import { DeleteButton } from "./DeleteButton";

// 后台文章管理页：/admin
// 列出全部文章（含草稿），每条带「编辑」链接和「删除」按钮。
// 「删除」是一个提交到 deletePost（Server Action）的表单——不需要写任何 API。
//
// 后台必须每次请求都查最新数据：生产构建若被静态化，会看到过期的文章列表。
export const dynamic = "force-dynamic";

export default async function AdminIndex() {
  const posts = await getAdminPosts();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">文章管理</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/new"
            className="rounded-full border border-card-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card"
          >
            写文章
          </a>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-card-border px-5 py-2 text-sm font-medium text-muted transition-colors hover:bg-card"
            >
              退出登录
            </button>
          </form>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted">还没有文章。</p>
      ) : (
        <ul className="mt-8 divide-y divide-card-border">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between py-3">
              <div className="flex items-baseline gap-2">
                <a
                  href={`/posts/${post.id}`}
                  className="text-foreground transition-colors hover:text-accent"
                >
                  {post.title}
                </a>
                {/* 已发布用强调色（正向），草稿用弱化色——红留给「删除」这类危险操作 */}
                <span
                  className={
                    post.published ? "text-xs text-accent" : "text-xs text-muted"
                  }
                >
                  {post.published ? "已发布" : "草稿"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <a
                  href={`/admin/${post.id}/edit`}
                  className="text-accent transition-colors hover:underline"
                >
                  编辑
                </a>
                <DeleteButton id={post.id} title={post.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
