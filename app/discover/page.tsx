import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Discover() {
  return (
    <main>
      {/* Hero */}
      <section className="container mt-6">
        <div className="rounded-2xl bg-primary text-white p-6">
          <h1 className="font-extrabold text-2xl">Swapboard — Cross-Promos that Actually Convert</h1>
          <p className="mt-2 text-sm opacity-95">Find matching Whop partners, auto-generate posts, and track paid members. Install in minutes.</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button>Install</Button>
            <Button variant="secondary">Preview Matches</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["Smart Matching","Audience overlap + size parity to find high-fit partners."],
          ["One-click Proposals","AI-written copy and UTM links. Post together in minutes."],
          ["Clear $$ Attribution","Clicks → signups → paid conversions, monthly reporting."]
        ].map(([title,desc],i)=> (
          <Card key={i} className="h-[160px]">
            <CardContent className="pt-5">
              <div className="font-bold">{title}</div>
              <div className="text-sm text-neutral-700 mt-2">{desc}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Social proof */}
      <section className="container mt-5">
        <Card>
          <CardContent>
            <div className="font-bold mb-3">Recent wins</div>
            <div className="flex flex-wrap gap-2">
              {["+214 new members","+$9.2k attributed","Avg 31% acceptance rate","Under 6 min to launch"].map((c)=>(
                <Badge key={c}>{c}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="rounded-xl bg-muted/80 text-neutral-700 mt-3 px-4 py-3">
          Built for Whop • Uses native payments & webhooks • Install with one click
        </div>
      </section>
    </main>
  );
}
