import { cookies } from "next/headers";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";

// ---------------------------------------------------------------------------
// 密码校验 + 从 Cookie 读登录态（服务端组件 / Server Action 用）
//
// 密码绝不明文存：users 表的 passwordHash 列存 scrypt 哈希（格式 scrypt$<salt>$<hash>），
// 每次登录拿输入密码 + 同一个 salt 再算一遍哈希去比，比对用 timingSafeEqual
// 防「响应时间差」侧信道。用户不存在也返回 false（login 里统一给笼统错误，不透露存在性）。
// ---------------------------------------------------------------------------

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;

/** 校验某用户的密码是否匹配（按 username 查 users 表比对哈希） */
export async function verifyPassword(
  username: string,
  password: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return false; // 用户不存在，直接失败（不 throw，避免时序侧信道泄露存在性）

  const [scheme, salt, expected] = user.passwordHash.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;

  const actual = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString(
    "hex",
  );

  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expected, "hex");
  // 长度不等时 timingSafeEqual 会抛错，先挡一道
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 当前请求是否已登录 */
export async function isLoggedIn(): Promise<boolean> {
  // Next 15/16 起 cookies() 是异步的，必须 await
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * 写操作的硬闸门：createPost / updatePost / deletePost 每个都要先过这里。
 *
 * 为什么不能只靠 proxy.ts 拦路由？因为 Server Action 是独立的 POST 端点，
 * 光拦页面挡不住直接构造请求调用 action。权限校验必须放在「真正改数据的地方」。
 */
export async function requireAuth(): Promise<void> {
  if (!(await isLoggedIn())) {
    throw new Error("未登录，拒绝执行写操作");
  }
}

/** 登录成功：下发 HttpOnly 会话 Cookie */
export async function startSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true, // JS 读不到，XSS 偷不走
    secure: process.env.NODE_ENV === "production", // 生产只走 HTTPS
    sameSite: "lax", // 挡 CSRF
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** 退出登录：清掉会话 Cookie */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
