"use client";
import * as React from "react";
import { useIframeSdk } from "@whop/react";

export default function DebugExperience(){
  const sdk = useIframeSdk();
  const [info, setInfo] = React.useState<any>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(()=>{
    let mounted = true;
    sdk.getTopLevelUrlData().then(d => {
      if (!mounted) return;
      setInfo(d);
    }).catch(e => {
      if (!mounted) return;
      setErr(String(e?.message || e));
    });
    return ()=>{ mounted = false; };
  },[sdk]);

  return (
    <main className="container py-6">
      <h1 className="font-bold text-xl mb-4">Whop iFrame Debug</h1>
      <div className="mb-2 text-sm text-neutral-700">NEXT_PUBLIC_WHOP_APP_ID: {process.env.NEXT_PUBLIC_WHOP_APP_ID || "(not set)"}</div>
      <div className="mb-4 text-sm text-neutral-700">NEXT_PUBLIC_WHOP_PARENT_ORIGIN: {process.env.NEXT_PUBLIC_WHOP_PARENT_ORIGIN || "(not set)"}</div>
      {err && <div className="text-red-600 text-sm">Error: {err}</div>}
      {info && (
        <pre className="text-xs bg-neutral-50 border rounded-lg p-3 whitespace-pre-wrap">{JSON.stringify(info, null, 2)}</pre>
      )}
      {!info && !err && <div className="text-sm text-neutral-600">Loading Whop context…</div>}
    </main>
  );
}

