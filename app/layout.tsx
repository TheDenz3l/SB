import type { Metadata } from "next";
import "./globals.css";
// Whop provider is scoped to the `experiences` segment to avoid
// pulling client-only code into all routes at build time.

export const metadata: Metadata = {
  title: "Swapboard — Whop App",
  description: "Cross-promos that actually convert.",
};

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
