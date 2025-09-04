import * as React from "react";

export function AppHeader({ title }: { title: string }) {
  return (
    <div>
      <div className="w-full bg-primary text-white">
        <div className="container py-5">
          <h1 className="font-extrabold text-xl">{title}</h1>
        </div>
      </div>
    </div>
  );
}
