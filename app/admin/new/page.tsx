import { createPost } from "../actions";

// 写文章页面（后台）。
// 这是一个服务端组件，直接把 Server Action 作为 <form> 的 action 属性传入，
// 浏览器原生表单提交就会调用它——无需写任何 fetch / API。
//
// 注意：现在 /admin 还没做登录保护（那是阶段 2 的事）。
// 学完阶段 2 后，要给这个目录加上鉴权中间件。
export default function NewPostPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        写文章
      </h1>

      <form action={createPost} className="mt-8 flex flex-col gap-5">
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
            className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="给文章起个标题"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="content"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            正文
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="支持 Markdown（下个节点再接渲染）"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="published" />
          直接发布（不勾就是草稿）
        </label>

        <button
          type="submit"
          className="self-start rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          发布
        </button>
      </form>
    </main>
  );
}
