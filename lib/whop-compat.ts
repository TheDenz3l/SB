// Re-export from the official package with fallback. Keeping a single import shim
// so app code can reference a stable path.
"use client";
import * as React from "react";

// Try to import from @whop/react/iframe, fallback to custom implementation
let WhopProvider: any;
let useWhopSdk: any;

try {
  const whopIframe = require("@whop/react/iframe");
  WhopProvider = whopIframe.WhopIframeSdkProvider;
  useWhopSdk = whopIframe.useIframeSdk;
} catch (error) {
  console.warn("Failed to load @whop/react/iframe, using fallback");
  
  const Ctx = React.createContext<any>(null);
  
  WhopProvider = function WhopIframeSdkProvider({
    children,
    options = {},
  }: React.PropsWithChildren<{ options?: any }>) {
    const [sdk, setSdk] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
      // Fallback implementation that doesn't crash
      const mockSdk = {
        getTopLevelUrlData: () => Promise.resolve({
          experienceId: "fallback",
          viewType: "app",
          companyRoute: "",
          experienceRoute: "",
          baseHref: "",
          fullHref: ""
        }),
        onHrefChange: () => Promise.resolve("ok"),
        openExternalUrl: () => Promise.resolve("ok"),
        inAppPurchase: () => Promise.resolve({ status: "error", error: "Not available" }),
        closeApp: () => Promise.resolve("ok"),
        openHelpChat: () => Promise.resolve("ok"),
        getColorTheme: () => Promise.resolve({}),
        _cleanupTransport: () => {}
      };
      setSdk(mockSdk);
    }, []);
    
    return React.createElement(Ctx.Provider, { value: sdk }, children);
  };
  
  useWhopSdk = function useIframeSdk() {
    const sdk = React.useContext(Ctx);
    if (!sdk) throw new Error("useIframeSdk must be used within a WhopIframeSdkProvider");
    return sdk;
  };
}

export const WhopIframeSdkProvider = WhopProvider;
export const useIframeSdk = useWhopSdk;
export type WhopIframeSdkProviderOptions = any;

// Theme script is optional; no-op to keep API compatible.
export function WhopThemeScript() { return null as any; }
