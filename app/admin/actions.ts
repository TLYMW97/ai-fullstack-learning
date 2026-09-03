// 这是一个「Server Action」——带 "use server" 的文件，里面的每个导出函数
// 都变成了一个能直接在表单里调用的服务端函数。
//
// 和传统写法的区别（重点）：
//   旧写法：前端 fetch('/api/posts') → 后端 route handler 接收 body → 写库 → 返回 JSON
//   现在：    <form action={createPost}> 提交 → 浏览器把表单数据发给这个服务端函数 → 写库
// 少了一层 HTTP 接口和前后端联调，但函数本身只在服务器跑，密码/连接串不会到前端。
"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() || null;
  const published = formData.get("published") === "on";

  if (!title) {
    throw new Error("标题不能为空");
  }

  await prisma.post.create({
    data: { title, content, published },
  });

  // 写完后跳回首页。redirect 会抛出一个特殊的 NEXT_REDIRECT 异常来中断函数，
  // 这是 Next.js 的正常机制，不是报错。
  redirect("/");
}

export async function updatePost(formData: FormData) {
  const id = Number(formData.get("id"));
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() || null;
  const published = formData.get("published") === "on";

  if (Number.isNaN(id)) throw new Error("无效的文章 id");
  if (!title) throw new Error("标题不能为空");

  await prisma.post.update({
    where: { id },
    data: { title, content, published },
  });

  // 数据变了，让首页和详情页重新生成，否则会看到旧缓存。
  revalidatePath("/");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePost(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isNaN(id)) throw new Error("无效的文章 id");

  await prisma.post.delete({ where: { id } });

  revalidatePath("/");
  redirect("/");
}
