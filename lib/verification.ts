import { randomInt } from "node:crypto";

// ---------------------------------------------------------------------------
// 邮箱验证码的生成与校验（内存 Map，5 分钟过期，一次性）。
//
// 为什么存内存而不是数据库/Redis：
//   个人博客单实例够用，验证码是 5 分钟的短命数据，重启丢就丢了（用户重新发码）。
//   要支持多实例/服务端重启不丢验证码，再换成 Redis 或数据库表。
// ---------------------------------------------------------------------------

type CodeEntry = { code: string; expiresAt: number };

// 挂 globalThis，避免 dev 热更新时模块重载把验证码清空（同 lib/db.ts 的 prisma 单例技巧）
const globalForCodes = globalThis as unknown as {
  emailCodes?: Map<string, CodeEntry>;
};
const store = globalForCodes.emailCodes ?? new Map<string, CodeEntry>();
globalForCodes.emailCodes = store;

const TTL_MS = 5 * 60 * 1000; // 5 分钟

/** 生成 6 位数字验证码（用 crypto 随机数，不用 Math.random） */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** 存一个验证码，5 分钟过期 */
export function saveCode(email: string, code: string): void {
  store.set(email, { code, expiresAt: Date.now() + TTL_MS });
}

/** 校验验证码：正确且未过期才算通过；通过后立即删除（一次性，防重放） */
export function verifyCode(email: string, code: string): boolean {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }
  if (entry.code !== code) return false;
  store.delete(email);
  return true;
}
