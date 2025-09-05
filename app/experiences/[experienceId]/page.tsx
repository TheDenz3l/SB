"use client";
import * as React from "react";
import { AppHeader } from "@/components/app/Header";
import { Tabs } from "@/components/ui/tabs";
import Matches from "@/components/app/Matches";
import Proposals from "@/components/app/Proposals";
import Analytics from "@/components/app/Analytics";
import Billing from "@/components/app/Billing";
import { useParams } from "next/navigation";
import { useIframeSdk } from "@/lib/whop-compat";

export default function ExperiencePage(){
  const [tab, setTab] = React.useState("matches");
  const params = useParams<{ experienceId: string }>();
  const iframeSdk = useIframeSdk();
  const [ctx, setCtx] = React.useState<{ experienceId: string; viewType: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);

  React.useEffect(() => {
    if (!iframeSdk) return;
    let mounted = true;
    iframeSdk.getTopLevelUrlData({}).then((data: any) => {
      if (!mounted) return;
      setCtx({ experienceId: data.experienceId, viewType: data.viewType });
      if (params?.experienceId && data.experienceId && params.experienceId !== data.experienceId) {
        setError("Experience mismatch — please open via Whop.");
      }
      // Probe profile to determine if onboarding is needed
      fetch(`/api/profile?experienceId=${data.experienceId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((j) => {
          if (j?.profile?.audienceSize && Array.isArray(j?.profile?.tags) && j.profile.tags.length > 0) {
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true);
          }
        })
        .catch((error) => {
          console.error('Error fetching profile:', error);
          setNeedsOnboarding(true);
        });
    }).catch(() => {
      if (!mounted) return;
      // Fallback: when not embedded, use the route param so the app remains usable in dev/preview
      if (params?.experienceId) {
        setCtx({ experienceId: params.experienceId as string, viewType: "app" });
        setError(null);
      } else {
        setError("Missing Whop context — open inside Whop.");
      }
    });
    return () => { mounted = false; };
  }, [iframeSdk, params?.experienceId]);

  return (
    <main>
      <AppHeader title="Experience • Swapboard" />
      <Tabs
        tabs={[
          { key: "matches", label: "Matches" },
          { key: "proposals", label: "Proposals" },
          { key: "analytics", label: "Analytics" },
          { key: "billing", label: "Billing" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {error && (
        <div className="container mt-4 text-sm text-red-600">{error}</div>
      )}
      {!error && !ctx && (
        <div className="container mt-4 text-sm text-neutral-600">Loading context…</div>
      )}
      {!error && ctx && needsOnboarding && (
        <div className="container mt-4">
          <div className="rounded-xl bg-muted px-4 py-3 text-sm">
            We need a few details to personalize matches.
            <a className="underline font-semibold ml-2" href={`/experiences/${params?.experienceId}/onboard`}>Complete onboarding</a>
          </div>
        </div>
      )}
      {!error && ctx && !needsOnboarding && (
        <>
          {tab === "matches" && <Matches experienceId={ctx.experienceId} />}
          {tab === "proposals" && <Proposals experienceId={ctx.experienceId} />}
          {tab === "analytics" && <Analytics />}
          {tab === "billing" && <Billing />}
        </>
      )}
    </main>
  );
}
