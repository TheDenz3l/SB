import * as React from "react";
import { clsx } from "clsx";

export function Badge({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={clsx("inline-flex items-center rounded-lg bg-muted text-foreground text-xs font-semibold px-2.5 py-1", className)}>{children}</span>;
}
