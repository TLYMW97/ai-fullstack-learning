import type { ReactNode } from "react";

/** 统一的内容容器：居中、限定宽度。
 *  narrow = max-w-3xl（≈68ch，文章阅读用）；wide = max-w-6xl（首页/导航撑满用）。 */
export function Container({
  size = "narrow",
  className = "",
  children,
}: {
  size?: "narrow" | "wide";
  className?: string;
  children: ReactNode;
}) {
  const width = size === "wide" ? "max-w-6xl" : "max-w-3xl";
  return (
    <div className={`mx-auto w-full ${width} px-6 ${className}`}>{children}</div>
  );
}
