// Local compatibility shim for the Whop iframe SDK types.
// Some versions require an options argument for getTopLevelUrlData, others accept none.
// We widen the signature to accept an optional argument to avoid TS errors across versions.

declare module "@whop/iframe" {
  export interface WhopIframeSdk {
    // Accept zero or one options param; return shape is intentionally loose.
    getTopLevelUrlData(options?: Record<string, unknown>): Promise<any>;
    inAppPurchase?: (args: Record<string, unknown>) => Promise<any>;
  }
}

