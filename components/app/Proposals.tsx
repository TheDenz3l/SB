import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Proposal = { id: string; partnerName: string; status: string; window?: string; offer?: string; aiCopy?: string; trackingUrl?: string | null };

function ProposalList({ title, kind, experienceId }: { title: string; kind: "inbox"|"sent"; experienceId: string }){
  const [items, setItems] = React.useState<Proposal[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});

  async function load(){
    setItems(null); setError(null);
    try {
      const res = await fetch(`/api/proposals?experienceId=${experienceId}&box=${kind}`);
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Failed to load');
      setItems(j.proposals || []);
    } catch(e:any) { setError(e.message || 'Failed to load'); }
  }

  React.useEffect(() => { load(); }, [experienceId, kind]);

  async function act(id: string, action: 'accept'|'decline'){
    setBusy(s=>({...s,[id]:true}));
    try {
      const res = await fetch('/api/proposals', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, experienceId })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Failed');
      await load();
    } catch(e:any) { alert(e.message || 'Failed'); }
    finally { setBusy(s=>({...s,[id]:false})); }
  }

  return (
    <div>
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!items && !error && <div className="text-sm text-neutral-600">Loading…</div>}
      {items && (
        <div className="grid gap-3">
          {items.length === 0 && <div className="text-sm text-neutral-700">No proposals.</div>}
          {items.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <CardTitle>{p.partnerName}</CardTitle>
                </div>
                <Badge className="capitalize">{p.status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(p.window || p.offer) && (
                  <div className="text-sm text-neutral-700">{p.window} • {p.offer}</div>
                )}
                {p.aiCopy && (
                  <pre className="text-xs bg-neutral-50 border rounded-lg p-3 whitespace-pre-wrap">{p.aiCopy}</pre>
                )}
                {p.trackingUrl && (
                  <div className="text-xs bg-neutral-50 border rounded-lg p-3 flex items-center justify-between gap-2">
                    <span className="truncate">{p.trackingUrl}</span>
                    <Button
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(p.trackingUrl!)}
                    >Copy link</Button>
                  </div>
                )}
                <div className="flex gap-2 justify-end mt-2">
                  {kind==="inbox" ? (
                    <>
                      <Button disabled={busy[p.id] || p.status!=='pending'} onClick={()=>act(p.id,'accept')}>{busy[p.id]? 'Working…' : 'Accept'}</Button>
                      <Button variant="ghost" disabled={busy[p.id] || p.status!=='pending'} onClick={()=>act(p.id,'decline')}>Decline</Button>
                    </>
                  ) : (
                    <Button variant="ghost">View details</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Proposals({ experienceId }: { experienceId: string }){
  return (
    <div className="container py-6 grid gap-6 lg:grid-cols-2">
      <ProposalList title="Inbox" kind="inbox" experienceId={experienceId} />
      <ProposalList title="Sent" kind="sent" experienceId={experienceId} />
    </div>
  );
}
