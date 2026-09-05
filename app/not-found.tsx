import Link from "next/link";
import { Container } from "@/components/Container";

// 自定义 404：Next 约定文件，任何 notFound() 或未匹配路由都会渲染它。
// 覆盖 Next 默认的英文 "404 This page could not be found"，统一成中文 + 返回首页。
export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-6xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">页面不存在</h1>
      <p className="mt-2 text-muted">你要找的内容可能已被删除或移动了。</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        返回首页
      </Link>
    </Container>
  );
}
