import { WhopServerSdk } from "@whop/api";
import { env } from "./env";

export const whop = WhopServerSdk({
  appId: env.NEXT_PUBLIC_WHOP_APP_ID,
  appApiKey: env.WHOP_API_KEY,
});
