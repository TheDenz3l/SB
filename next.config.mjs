import { withWhopAppConfig } from "@whop/react/next.config";
import fs from "node:fs";

/** @type {import('next').NextConfig} */
// Choose a writable distDir. If NEXT_DIST_DIR is set, use it; otherwise prefer default '.next'.
const candidates = [
  process.env.NEXT_DIST_DIR,
  ".next",
  `.next-user-${typeof process.getuid === "function" ? process.getuid() : "local"}`,
  `.next-${Date.now().toString(36)}`,
].filter(Boolean);

let distDir = ".next";
for (const c of candidates) {
  try {
    fs.mkdirSync(c, { recursive: true });
    fs.accessSync(c, fs.constants.W_OK);
    distDir = c;
    break;
  } catch {}
}

const nextConfig = {
  distDir,
  // Optionally bypass build-time TS errors from upstream SDK types when set.
  typescript: {
    ignoreBuildErrors: process.env.NEXT_IGNORE_TYPE_ERRORS === "1",
  },
};

export default withWhopAppConfig(nextConfig);
