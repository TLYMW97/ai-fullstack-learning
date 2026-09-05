import { NextResponse } from "next/server";
import { readTokenFromCookieHeader, verifySessionToken } from "@/lib/session";

// ---------------------------------------------------------------------------
// 路由保护：没登录访问 /admin/* 一律送登录页。
//
// Next 16 的两个变化（和老教程不一样，别照抄 middleware.ts）：
//   1. 文件名 middleware.ts → proxy.ts
//   2. 导出函数名 middleware → proxy
// 而且 proxy 只跑 Node.js 运行时（不再支持 edge），所以能直接用 node:crypto 验签名。
//
// 注意：proxy 只拦「页面请求」。Server Action 是独立的 POST 端点，
// 所以改数据的三个 action 里还各自调了 requireAuth()（见 app/admin/actions.ts）。
// ---------------------------------------------------------------------------
export function proxy(request: Request) {
  const token = readTokenFromCookieHeader(request.headers.get("cookie"));

  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // :path* 允许零段，所以 /admin 本身也会被拦
  matcher: ["/admin/:path*"],
};
