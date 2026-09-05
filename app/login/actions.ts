"use server";

import { redirect } from "next/navigation";
import { startSession, verifyPassword } from "@/lib/auth";

// 登录：密码对就发会话 Cookie，不对就回登录页带个错误标记。
//
// ponytail: 这里没有做「失败次数限制」。个人博客后台够用，
// 真要防暴力破解，正解是阶段 2 方案 C（极验滑块）或加失败计数，
// 等你要接的时候再找我确认配置。
export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // 校验失败只回一个笼统的错误，不要透露「用户不存在」这类信息
  if (!username || !password || !(await verifyPassword(username, password))) {
    redirect("/login?error=1");
  }

  await startSession();
  redirect("/admin");
}
