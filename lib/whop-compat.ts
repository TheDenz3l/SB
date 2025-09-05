// Re-export from the official package. Keeping a single import shim
// so app code can reference a stable path.
"use client";
import * as React from "react";
import { createSdk } from "@whop/iframe";

// Minimal, React 18–safe wrapper around @whop/iframe.
// Avoids importing the React hook that depends on React 19's `use()`.

type WhopIframeSdkProviderOptions = Parameters<typeof createSdk>[0];

const Ctx = React.createContext<any>(null);

export function WhopIframeSdkProvider({
  children,
  options = {},
}: React.PropsWithChildren<{ options?: WhopIframeSdkProviderOptions }>) {
  const sdkRef = React.useRef<any>();
  if (!sdkRef.current) sdkRef.current = createSdk(options);
  return React.createElement(Ctx.Provider, { value: sdkRef.current }, children);
}

export function useIframeSdk() {
  const sdk = React.useContext(Ctx);
  if (!sdk) throw new Error("useIframeSdk must be used within a WhopIframeSdkProvider");
  return sdk;
}

// Theme script is optional; no-op to keep API compatible.
export function WhopThemeScript() { return null as any; }
