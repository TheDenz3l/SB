import * as React from "react";

export function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-neutral-100">
      <div className="h-2 rounded-full bg-secondary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
