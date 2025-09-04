"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Match = { id: string; name: string; tags: string[]; overlap: number; boosted?: boolean };

export default function Matches({ experienceId }: { experienceId: string }) {
  const [matches, setMatches] = React.useState<Match[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});
  const [proposed, setProposed] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    let mounted = true;
    setMatches(null); setError(null);
    fetch(`/api/matches?experienceId=${experienceId}`).then(r=>r.json()).then((j)=>{
      if (!mounted) return;
      if (!j?.ok) throw new Error(j?.error || "Failed to fetch matches");
      setMatches(j.matches || []);
    }).catch((e)=>{
      if (!mounted) return;
      setError(e?.message || "Failed to load matches");
    });
    return () => { mounted = false };
  }, [experienceId]);

  if (error) return <div className="container py-6 text-sm text-red-600">{error}</div>;
  if (!matches) return <div className="container py-6 text-sm text-neutral-600">Loading matches…</div>;

  return (
    <div className="container py-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {matches.length === 0 && (
        <div className="text-sm text-neutral-700">No high-fit partners yet. Try adding broader tags or inviting peers.</div>
      )}
      {matches.map((p) => (
        <Card key={p.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div>
              <div className="font-bold flex items-center gap-2">
                <span>{p.name}</span>
                {p.boosted && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-white">Boosted</span>}
              </div>
              <div className="text-xs text-neutral-600">Suggested partner</div>
              </div>
            </div>
          <CardContent className="px-0">
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
            <div className="mt-4 text-xs text-neutral-600">Match score</div>
            <div className="mt-2"><Progress value={p.overlap} /></div>
            <div className="mt-4 flex gap-2">
              <Button
                disabled={!!busy[p.id] || !!proposed[p.id]}
                onClick={async ()=>{
                  setBusy(s=>({...s,[p.id]:true}));
                  try {
                    const res = await fetch('/api/proposals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ experienceId, toProfileId: p.id })
                    });
                    const j = await res.json();
                    if (!res.ok || !j.ok) throw new Error(j.error || 'Failed to propose');
                    setProposed(s=>({...s,[p.id]:true}));
                  } catch (e) {
                    alert((e as any)?.message || 'Failed to propose');
                  } finally {
                    setBusy(s=>({...s,[p.id]:false}));
                  }
                }}
              >{proposed[p.id] ? 'Proposed' : (busy[p.id] ? 'Proposing…' : 'Propose swap')}</Button>
              <Button variant="ghost">View profile</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
