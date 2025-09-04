import { withWhopAppConfig } from "@whop/react/next.config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow overriding build dir via env to avoid permission issues
  distDir: process.env.NEXT_DIST_DIR || '.next-local-user',
};

export default withWhopAppConfig(nextConfig);
