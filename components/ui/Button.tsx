import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 transition-opacity",
  outline:
    "border border-card-border text-foreground hover:bg-card transition-colors",
};

// 统一的 pill 按钮。primary=实心强调色，outline=描边。
// 只抽「确实重复」的两种；危险色（删除）等一次性样式不抽（只有一处，YAGNI）。
// 链接（<a>/<Link>）语义不同，不归这里管，保持原样。
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-full px-5 py-2 text-sm font-medium ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
