import { cookies } from "next/headers";
import { scryptSync, timingSafeEqual } from "node:crypto";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";

// ---------------------------------------------------------------------------
// 密码校验 + 从 Cookie 读登录态（服务端组件 / Server Action 用）
//
// 密码绝不明文存：.env 里放的是 scrypt 哈希（格式 scrypt$<salt>$<hash>），
// 每次登录拿输入密码 + 同一个 salt 再算一遍哈希去比，比对用 timingSafeEqual
// 防「响应时间差」侧信道。
// ---------------------------------------------------------------------------

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;

/** 校验输入密码是否等于 .env 里那个哈希对应的明文 */
export function verifyPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) {
    throw new Error("ADMIN_PASSWORD_HASH 未设置：请检查项目根目录的 .env");
  }

  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) {
    throw new Error("ADMIN_PASSWORD_HASH 格式不对，应为 scrypt$<salt>$<hash>");
  }

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
