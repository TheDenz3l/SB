// Re-export from the official package. Keeping a single import shim
// so app code can reference a stable path.
export { WhopIframeSdkProvider, useIframeSdk, type WhopIframeSdkProviderOptions } from "@whop/react/iframe";

// Theme script is optional; no-op to keep API compatible.
export function WhopThemeScript() { return null as any; }
