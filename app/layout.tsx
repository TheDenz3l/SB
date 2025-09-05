import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swapboard — Whop App",
  description: "Cross-promos that actually convert.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <WhopApp>{children}</WhopApp>
      </body>
    </html>
  );
}
