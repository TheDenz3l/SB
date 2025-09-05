"use client";
import * as React from "react";
import { useIframeSdk } from "@/lib/whop-compat";

function EmbeddedDebug() {
  const sdk = useIframeSdk();
  const [info, setInfo] = React.useState<any>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(()=>{
    let mounted = true;
    sdk.getTopLevelUrlData({}).then((d: any) => {
      if (!mounted) return;
      setInfo(d);
    }).catch((e: any) => {
      if (!mounted) return;
      setErr(String(e?.message || e));
    });
    return ()=>{ mounted = false; };
  },[sdk]);

  return (
    <>
      {err && <div className="text-red-600 text-sm">Error: {err}</div>}
      {info && (
        <pre className="text-xs bg-neutral-50 border rounded-lg p-3 whitespace-pre-wrap">{JSON.stringify(info, null, 2)}</pre>
      )}
      {!info && !err && <div className="text-sm text-neutral-600">Loading Whop context…</div>}
    </>
  );
}

export default function DebugExperience(){
  const [isEmbedded, setIsEmbedded] = React.useState(false);

  React.useEffect(() => {
    setIsEmbedded(typeof window !== 'undefined' && window.self !== window.top);
  }, []);

  return (
    <main className="container py-6">
      <h1 className="font-bold text-xl mb-4">Whop iFrame Debug</h1>
      <div className="mb-2 text-sm text-neutral-700">NEXT_PUBLIC_WHOP_APP_ID: {process.env.NEXT_PUBLIC_WHOP_APP_ID || "(not set)"}</div>
      <div className="mb-4 text-sm text-neutral-700">NEXT_PUBLIC_WHOP_PARENT_ORIGIN: {process.env.NEXT_PUBLIC_WHOP_PARENT_ORIGIN || "(not set)"}</div>
      {!isEmbedded && (
        <div className="text-sm text-neutral-700">
          Not embedded in Whop — open this page from your Whop app tile to see iFrame context.
        </div>
      )}
      {isEmbedded && <EmbeddedDebug />}
    </main>
  );
}
