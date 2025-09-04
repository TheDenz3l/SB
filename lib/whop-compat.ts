// Re-export from the official package. Keeping a single import shim
// so app code can reference a stable path.
"use client";
import * as React from "react";

// Re-export provider/component from the official package
export { WhopThemeScript, WhopIframeSdkProvider } from "@whop/react";

// Use a compatibility hook that relies on useContext instead of React 19 `use()`
import { WhopIframeSdkContext } from "@whop/react/iframe";

export function useIframeSdk() {
  const sdk = React.useContext(WhopIframeSdkContext as unknown as React.Context<any>);
  if (!sdk) throw new Error("useIframeSdk must be used within a WhopIframeSdkProvider");
  return sdk;
}
