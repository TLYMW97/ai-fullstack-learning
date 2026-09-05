"use client";

import { useEffect } from "react";

// 全局错误边界：路由段页面/组件渲染抛错时显示，兜住 Next 默认的英文错误页。
// 必须是 "use client"（错误边界靠客户端 React 的 componentDidCatch 实现）。
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 错误日志：生产环境应接到监控（阶段 7 埋点/日志），现在先 console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-gradient">出错了</p>
      <p className="mt-4 text-muted">页面渲染时出了点问题，点下面重试。</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        重试
      </button>
    </div>
  );
}
