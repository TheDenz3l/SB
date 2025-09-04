"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardPage(){
  const { experienceId } = useParams<{ experienceId: string }>();
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [audienceSize, setAudienceSize] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(){
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceId, title, tags, audienceSize: Number(audienceSize) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to save");
      router.push(`/experiences/${experienceId}`);
    } catch (e: any) {
      setError(e?.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <AppHeader title="Onboarding • Swapboard" />
      <div className="container py-6">
        <Card>
          <CardContent>
            <div className="font-bold mb-2">Tell us about your audience</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm text-neutral-700">Display name</span>
                <input className="h-10 rounded-xl border px-3" placeholder="e.g. Alpha Club"
                  value={title} onChange={e=>setTitle(e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-neutral-700">Audience size</span>
                <input className="h-10 rounded-xl border px-3" placeholder="e.g. 12000" inputMode="numeric"
                  value={audienceSize} onChange={e=>setAudienceSize(e.target.value.replace(/[^0-9]/g, ""))} />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm text-neutral-700">Tags (comma separated)</span>
                <input className="h-10 rounded-xl border px-3" placeholder="e.g. crypto, education, ai"
                  value={tags} onChange={e=>setTags(e.target.value)} />
              </label>
            </div>
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            <div className="mt-4">
              <Button disabled={saving || !audienceSize || !tags} onClick={save}>{saving?"Saving…":"Save & Continue"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

