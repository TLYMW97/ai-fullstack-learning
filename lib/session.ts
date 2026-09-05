import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// 会话令牌的签发与校验（纯 node:crypto，不碰 next/headers）
//
// 为什么单独一个文件：proxy.ts（Next 16 由 middleware.ts 改名而来）也要校验
// 登录态，而 proxy 里导入 next/headers 会出问题。所以把「不依赖请求上下文」的
// 纯密码学操作抽在这里，proxy 和页面都能安全复用。
//
// 为什么不用 JWT / 不存数据库：
//   单人博客只需要「这个 Cookie 是不是我签发的、过没过期」，
//   签名 Cookie 就够了 —— 不用改表、不用每次请求查库。
//   ponytail: 代价是无法服务端主动吊销（除非改 SESSION_SECRET），
//   想支持「踢下线 / 多用户」时再换成数据库 Session 表。
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "admin_session";

/** 会话有效期：12 小时 */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET 未设置：请检查项目根目录的 .env");
  return s;
}

/** 用 HMAC-SHA256 给载荷签名：别人改了内容签名就对不上 */
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** 签一个「过期时间戳.签名」的令牌 */
export function createSessionToken(): string {
  const payload = String(Date.now() + SESSION_TTL_MS);
  return `${payload}.${sign(payload)}`;
}

/** 校验令牌：签名对不对 + 有没有过期 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const sep = token.lastIndexOf(".");
  if (sep <= 0) return false;

  const payload = token.slice(0, sep);
  const signature = token.slice(sep + 1);
  const expected = sign(payload);

  // timingSafeEqual 要求两个 buffer 长度一致，否则直接抛错，所以先比长度。
  // 用「恒定时间比较」是为了不让人通过响应时间差暴力猜签名。
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

/** 从 Cookie 头里取出会话令牌（proxy 拿到的不是 NextRequest，手动解析最省事） */
export function readTokenFromCookieHeader(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}

/** 生成随机串（改密码 / 换 SESSION_SECRET 时用） */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
