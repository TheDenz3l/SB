"use client";
import * as React from "react";

// Re-export components directly from the official package
export { WhopThemeScript, WhopIframeSdkProvider } from "@whop/react";

// The upstream hook currently uses React 19's `use()` API. To remain
// compatible with React 18/Next 14, read the context via useContext.
// This mirrors the behavior of the upstream hook.
import { WhopIframeSdkContext } from "@whop/react/iframe";

export function useIframeSdk() {
  const sdk = React.useContext(WhopIframeSdkContext as unknown as React.Context<any>);
  if (!sdk) throw new Error("useIframeSdk must be used within a WhopIframeSdkProvider");
  return sdk;
}
