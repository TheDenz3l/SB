import * as React from "react";
import clsx from "clsx";

export function Card({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("bg-white rounded-2xl border border-border shadow-card", className)}>{children}</div>;
}
export function CardHeader({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-5 py-4 border-b border-border", className)}>{children}</div>;
}
export function CardContent({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>;
}
export function CardTitle({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <h3 className={clsx("font-bold text-lg", className)}>{children}</h3>;
}
