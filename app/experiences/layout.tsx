import { ReactNode } from "react";
import { WhopIframeSdkProvider } from "@/lib/whop-compat";

export default function ExperiencesLayout({ children }: { children: ReactNode }) {
  const parentOrigins = (process.env.NEXT_PUBLIC_WHOP_PARENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <WhopIframeSdkProvider
        options={
          parentOrigins.length
            ? { overrideParentOrigins: parentOrigins }
            : {}
        }
      >
        {children}
      </WhopIframeSdkProvider>
    </>
  );
}

