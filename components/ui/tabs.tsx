"use client";
import * as React from "react";
import clsx from "clsx";

type Tab = { key: string; label: string };

export function Tabs({
  tabs,
  active,
  onChange,
  className
}: {
  tabs: Tab[];
  active: string;
  onChange: (k: string) => void;
  className?: string;
}) {
  return (
    <div className={clsx("bg-white border-b border-border", className)}>
      <div className="container flex gap-2 py-2 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={clsx(
              "px-3 h-9 rounded-xl text-sm font-semibold",
              t.key === active ? "bg-muted text-foreground" : "text-neutral-600 hover:bg-neutral-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
