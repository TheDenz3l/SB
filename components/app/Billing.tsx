import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, TH, TR, TD } from "@/components/ui/table";
import { useIframeSdk } from "@/lib/whop-compat";
import { useParams } from "next/navigation";

type Invoice = { id: string; periodStart: string; periodEnd: string; successFeeCents: number; minimumCents: number; amountDueCents: number; status: string };

function cents(n: number){ return `$${(n/100).toFixed(0)}`; }
function periodLabel(s: string, e: string){
  const sd = new Date(s); const ed = new Date(e); ed.setUTCDate(ed.getUTCDate()-1);
  return `${sd.toLocaleString(undefined,{month:'short'})} ${sd.getUTCDate()}–${ed.getUTCDate()}`;
}

export default function Billing(){
  const iframeSdk = useIframeSdk();
  const params = useParams<{ experienceId: string }>();
  const [experienceId, setExperienceId] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Invoice | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [boosts, setBoosts] = React.useState<{ activeCredits: number } | null>(null);
  const [buying, setBuying] = React.useState<string | null>(null);

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
    setError(null); setSummary(null); setInvoices(null);
    fetch(`/api/invoices?experienceId=${experienceId}`).then(r=>r.json()).then(j=>{
      if (!j.ok) throw new Error(j.error || 'Failed to load invoices');
      setSummary(j.summary);
      setInvoices(j.invoices || []);
    }).catch(e=> setError(e.message || 'Failed to load invoices'));
    fetch(`/api/boosts?experienceId=${experienceId}`).then(r=>r.json()).then(j=>{
      if (j.ok) setBoosts({ activeCredits: j.activeCredits });
    }).catch(()=>{});
  },[experienceId]);

  async function buy(planId: string){
    if (!iframeSdk) return;
    const sdk = iframeSdk as any;
    if (!planId) return;
    setBuying(planId);
    try {
      const res = await sdk.inAppPurchase({ planId });
      if (res.status === 'ok') {
        // webhook will grant credits; refresh after a short delay
        setTimeout(()=> experienceId && fetch(`/api/boosts?experienceId=${experienceId}`).then(r=>r.json()).then(j=> setBoosts({ activeCredits: j.activeCredits })).catch(()=>{}), 1500);
      }
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="container py-6 grid gap-3">
      <Card>
        <CardContent className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-lg font-bold">Monthly summary</div>
            {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
            {summary && (
              <div className="text-sm text-neutral-700 mt-1">
                Success fee: {cents(summary.successFeeCents)} • Minimum: {cents(summary.minimumCents)} • <span className="font-semibold">Amount due: {cents(summary.amountDueCents)}</span>
              </div>
            )}
            {!summary && !error && <div className="text-sm text-neutral-600 mt-1">Loading…</div>}
          </div>
          <Button disabled>Pay invoice</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="font-bold mb-3">Invoice history</div>
          {!invoices && !error && <div className="text-sm text-neutral-600">Loading…</div>}
          {invoices && (
            <Table>
              <THead>
                <TR><TH>Period</TH><TH>Success fee</TH><TH>Minimum</TH><TH>Amount due</TH><TH>Status</TH></TR>
              </THead>
              <TBody>
                {invoices.map((inv)=> (
                  <TR key={inv.id}>
                    <TD>{periodLabel(inv.periodStart, inv.periodEnd)}</TD>
                    <TD>{cents(inv.successFeeCents)}</TD>
                    <TD>{cents(inv.minimumCents)}</TD>
                    <TD>{cents(inv.amountDueCents)}</TD>
                    <TD className="capitalize">{inv.status}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="font-bold">Boost Credits</div>
            <div className="text-sm text-neutral-700">Get priority placement and auto-outbound proposals.</div>
            {boosts && <div className="text-xs text-neutral-600 mt-1">Active credits: {boosts.activeCredits}</div>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={()=> buy(process.env.NEXT_PUBLIC_BOOST_PLAN_ID_ONE as string)} disabled={!process.env.NEXT_PUBLIC_BOOST_PLAN_ID_ONE || !!buying}>
              {buying===process.env.NEXT_PUBLIC_BOOST_PLAN_ID_ONE ? 'Processing…' : 'Buy 1 Boost'}
            </Button>
            <Button onClick={()=> buy(process.env.NEXT_PUBLIC_BOOST_PLAN_ID_FIVE as string)} disabled={!process.env.NEXT_PUBLIC_BOOST_PLAN_ID_FIVE || !!buying}>
              {buying===process.env.NEXT_PUBLIC_BOOST_PLAN_ID_FIVE ? 'Processing…' : 'Buy 5 Boosts'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
