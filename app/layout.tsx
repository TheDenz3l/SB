import "./globals.css";
import type { Metadata } from "next";
import { WhopThemeScript, WhopIframeSdkProvider } from "@whop/react";

export const metadata: Metadata = {
  title: "Swapboard — Whop App",
  description: "Cross-promos that actually convert.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Allow setting parent origin for dev embeds like https://<id>.apps.whop.com
  const sdkOptions = {
    appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
    ...(process.env.NEXT_PUBLIC_WHOP_PARENT_ORIGIN
      ? { overrideParentOrigins: [process.env.NEXT_PUBLIC_WHOP_PARENT_ORIGIN as string] }
      : {}),
  } as any;
  return (
    <html lang="en">
      <head>
        <WhopThemeScript />
      </head>
      <body className="min-h-screen">
        <WhopIframeSdkProvider options={sdkOptions}>
          {children}
        </WhopIframeSdkProvider>
      </body>
    </html>
  );
}
