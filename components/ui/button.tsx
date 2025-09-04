import * as React from "react";
import { clsx } from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string,string> = {
    primary: "bg-primary text-primary-foreground hover:bg-secondary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-primary",
    ghost: "bg-white border border-border text-foreground hover:bg-muted/50",
  };
  const sizes: Record<string,string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
