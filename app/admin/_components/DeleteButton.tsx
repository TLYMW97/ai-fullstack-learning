"use client";

// 删除按钮：包一层 confirm，误点不会直接删。
//
// 为什么是个客户端组件：confirm() 是浏览器 API，必须在客户端事件里跑，
// 所以包一层 "use client"。但它仍然复用 deletePost 这个 Server Action——
// 直接当 <form action={deletePost}> 提交，confirm 通过才放行，否则 preventDefault 拦掉。
// 这样既有二次确认，又不用自己写 fetch 调接口（Server Action 把请求协议都封装好了）。
import { deletePost } from "../actions";

export function DeleteButton({ id, title }: { id: number; title: string }) {
  return (
    <form action={deletePost}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`确定删除《${title}》吗？此操作不可撤销。`)) {
            e.preventDefault();
          }
        }}
        className="text-red-600 transition-colors hover:underline"
      >
        删除
      </button>
    </form>
  );
}
