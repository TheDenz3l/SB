"use client";
import * as React from "react";
import { WhopIframeSdkProvider } from "@/lib/whop-compat";

export default function ExperiencesLayout({ children }: { children: React.ReactNode }) {
  const envOrigins = (process.env.NEXT_PUBLIC_WHOP_PARENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Dynamically allow the exact parent origin when embedded in Whop dev hosts
  const dynamicOrigins = React.useMemo(() => {
    try {
      if (typeof document !== "undefined" && document.referrer) {
        const refOrigin = new URL(document.referrer).origin;
        if (/\.whop\.com$/.test(new URL(refOrigin).hostname)) {
          return [refOrigin];
        }
      }
    } catch {}
    return envOrigins;
  }, [envOrigins.join(",")]);

  // In dev, allow all origins to simplify testing if no env value is provided
  const options = dynamicOrigins.length > 0
    ? { overrideParentOrigins: dynamicOrigins }
    : (process.env.NODE_ENV !== "production"
        ? { overrideParentOrigins: [] as string[] }
        : {});

  return (
    <WhopIframeSdkProvider options={options}>
      {children}
    </WhopIframeSdkProvider>
  );
}
