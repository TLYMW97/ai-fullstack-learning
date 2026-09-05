import { createPost } from "../actions";

// 写文章页面（后台）。
// 服务端组件，直接把 Server Action 作为 <form> 的 action 属性传入，
// 浏览器原生表单提交就会调用它——无需写任何 fetch / API。
//
// 访问受 proxy.ts 保护：未登录会被重定向到 /login（见阶段 2，P19）。
export default function NewPostPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">写文章</h1>

      <form action={createPost} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-medium text-muted">
            标题
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded-md border border-card-border bg-card px-3 py-2 text-foreground"
            placeholder="给文章起个标题"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="content" className="text-sm font-medium text-muted">
            正文
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            className="rounded-md border border-card-border bg-card px-3 py-2 text-foreground"
            placeholder="支持 Markdown（下个节点再接渲染）"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="published" />
          直接发布（不勾就是草稿）
        </label>

        <button
          type="submit"
          className="self-start rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          发布
        </button>
      </form>
    </main>
  );
}
