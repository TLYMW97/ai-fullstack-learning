import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updatePost } from "../../actions";

// 编辑文章页：/admin/[id]/edit
// 服务端组件先按 id 查出文章，把现有值填进表单；
// 提交时表单 action 指向 updatePost（同一个文件里的 Server Action）。
export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        编辑文章
      </h1>

      <form action={updatePost} className="mt-8 flex flex-col gap-5">
        {/* 把 id 藏进表单，updatePost 才能知道改的是哪篇 */}
        <input type="hidden" name="id" value={post.id} />

        <div className="flex flex-col gap-2">
          <label
            htmlFor="title"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            标题
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={post.title}
            className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="content"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            正文（支持 Markdown）
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            defaultValue={post.content ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="published" defaultChecked={post.published} />
          直接发布（不勾就是草稿）
        </label>

        <button
          type="submit"
          className="self-start rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          更新
        </button>
      </form>
    </main>
  );
}
