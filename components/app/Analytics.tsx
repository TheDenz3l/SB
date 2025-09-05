"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, THead, TH, TR, TD } from "@/components/ui/table";
import { useIframeSdk } from "@/lib/whop-compat";
import { useParams } from "next/navigation";

function KPI({ label, value }: { label: string; value: string }){
  return (
    <Card className="p-4">
      <div className="text-xs text-neutral-600">{label}</div>
      <div className="text-2xl font-extrabold mt-2">{value}</div>
    </Card>
  );
}

function fmtCurrencyCents(n: number){
  const dollars = Math.round(n/100);
  return `$${dollars.toLocaleString()}`;
}

export default function Analytics(){
  const iframeSdk = useIframeSdk();
  const params = useParams<{ experienceId: string }>();
  const [experienceId, setExperienceId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [kpis, setKpis] = React.useState<any>(null);
  const [weekly, setWeekly] = React.useState<number[] | null>(null);
  const [partners, setPartners] = React.useState<any[] | null>(null);

  React.useEffect(()=>{ 
    if (!iframeSdk) return;
    iframeSdk.getTopLevelUrlData({})
      .then((d: any)=> setExperienceId(d.experienceId))
      .catch(()=> {
        // Fallback to route param when not embedded
        if (params?.experienceId) setExperienceId(params.experienceId as string);
        else setError('Missing context');
      }); 
  },[iframeSdk, params?.experienceId]);

  React.useEffect(()=>{
    if (!experienceId) return;
    setLoading(true); setError(null);
    fetch(`/api/analytics?experienceId=${experienceId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((j) => {
        if (!j.ok) throw new Error(j.error || 'Failed to load analytics');
        setKpis(j.kpis); setWeekly(j.weeklyRevenueCents); setPartners(j.topPartners);
      })
      .catch((e) => setError(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  },[experienceId]);

  const maxWeekly = weekly ? Math.max(1, ...weekly.map(v=> Math.abs(v))) : 1;

  return (
    <div className="container py-6 grid gap-3">
      <div className="grid gap-3 md:grid-cols-4">
        <KPI label="New paying members" value={kpis ? String(kpis.newPayingMembers) : '—'} />
        <KPI label="Attributed revenue" value={kpis ? fmtCurrencyCents(kpis.attributedRevenueCents) : '—'} />
        <KPI label="Acceptance rate" value={kpis ? `${kpis.acceptanceRate}%` : '—'} />
        <KPI label="Time to first swap" value={kpis ? kpis.timeToFirstSwapLabel : '—'} />
      </div>

      <Card>
        <CardContent>
          <div className="font-bold mb-3">Revenue attributed (last 8 weeks)</div>
          <div className="grid grid-cols-8 gap-3 items-end h-40">
            {(weekly ?? Array.from({length:8}).map(()=>0)).map((v,i)=>(
              <div key={i} className={`rounded-md ${i%2?'bg-primary':'bg-secondary'}`} style={{height: `${(Math.abs(v)/maxWeekly)*150 + 4}px`}} title={fmtCurrencyCents(v)} />
            ))}
          </div>
          <div className="mt-2 text-xs text-neutral-600">W1 W2 W3 W4 W5 W6 W7 W8</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="font-bold mb-3">Top partners by revenue</div>
          {!partners && !error && <div className="text-sm text-neutral-600">Loading…</div>}
          {partners && (
            <Table>
              <THead>
                <TR>
                  <TH>Partner</TH>
                  <TH>Clicks</TH>
                  <TH>Paid members</TH>
                  <TH>Revenue</TH>
                </TR>
              </THead>
              <TBody>
                {partners.map((r,i)=>(
                  <TR key={i}>
                    <TD>{r.partnerName}</TD>
                    <TD>{r.clicks.toLocaleString()}</TD>
                    <TD>{r.paidMembers}</TD>
                    <TD>{fmtCurrencyCents(r.revenueCents)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
