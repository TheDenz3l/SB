import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swapboard — Whop App",
  description: "Cross-promos that actually convert.",
};

// Avoid static prerendering to ensure compatibility with client-only SDKs
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
