// 这是一个「Server Action」——带 "use server" 的文件，里面的每个导出函数
// 都变成了一个能直接在表单里调用的服务端函数。
//
// 和传统写法的区别（重点）：
//   旧写法：前端 fetch('/api/posts') → 后端 route handler 接收 body → 写库 → 返回 JSON
//   现在：    <form action={createPost}> 提交 → 浏览器把表单数据发给这个服务端函数 → 写库
// 少了一层 HTTP 接口和前后端联调，但函数本身只在服务器跑，密码/连接串不会到前端。
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth, endSession } from "@/lib/auth";
// 数据访问收口到 lib/posts：这里只负责「接收表单 + 鉴权 + 缓存失效 + 跳转」，
// 不直接碰 prisma。函数名加 repo 前缀避免和本文件导出的 Server Action 重名。
import {
  createPost as repoCreatePost,
  updatePost as repoUpdatePost,
  deletePost as repoDeletePost,
} from "@/lib/posts";

// 从表单里取文章 id。
// ponytail: formData.get 拿到 null / 空串时 Number(null)===0、Number("")===0，
// 会绕过 Number.isNaN 检查，导致拿 id=0 去查库删库。所以先判字符串再转数字。
function parseId(raw: FormDataEntryValue | null): number {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error("无效的文章 id");
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效的文章 id");
  }
  return id;
}

export async function createPost(formData: FormData) {
  // 硬闸门：即使有人直接构造 POST 绕过 proxy 拦页面，这里也会再拦一次
  await requireAuth();

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() || null;
  const published = formData.get("published") === "on";

  if (!title) {
    throw new Error("标题不能为空");
  }

  await repoCreatePost({ title, content, published });

  // 首页是 ISR 静态页，不 revalidate 的话新文章要等最多 60s 再生才出现。
  revalidatePath("/");

  // 写完后跳回首页。redirect 会抛出一个特殊的 NEXT_REDIRECT 异常来中断函数，
  // 这是 Next.js 的正常机制，不是报错。
  redirect("/");
}

export async function updatePost(formData: FormData) {
  await requireAuth();

  const id = parseId(formData.get("id"));
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() || null;
  const published = formData.get("published") === "on";

  if (!title) throw new Error("标题不能为空");

  await repoUpdatePost(id, { title, content, published });

  // 数据变了，让首页、后台列表、详情页重新生成，否则会看到旧缓存。
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePost(formData: FormData) {
  await requireAuth();

  const id = parseId(formData.get("id"));

  await repoDeletePost(id);

  // 后台列表也要重新生成，否则删完还能看到已删的文章。
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/");
}

// 退出登录：清掉会话 Cookie 后回登录页。
// 放在这里是因为 deletePost 等同文件，类型都是 Server Action，登录态判断逻辑复用方便。
export async function logout() {
  await endSession();
  redirect("/login");
}
