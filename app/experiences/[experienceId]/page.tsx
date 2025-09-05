"use client";
import * as React from "react";
import { AppHeader } from "@/components/app/Header";
import { Tabs } from "@/components/ui/tabs";
import Matches from "@/components/app/Matches";
import Proposals from "@/components/app/Proposals";
import Analytics from "@/components/app/Analytics";
import Billing from "@/components/app/Billing";
import { useParams } from "next/navigation";

export default function ExperiencePage() {
  const params = useParams<{ experienceId: string }>();
  const experienceId = params?.experienceId || "";
  const [tab, setTab] = React.useState("matches");
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);

  // Check if onboarding is needed
  React.useEffect(() => {
    if (!experienceId) return;
    
    async function checkOnboarding() {
      try {
        const response = await fetch(`/api/profile?experienceId=${experienceId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data?.profile?.audienceSize && Array.isArray(data?.profile?.tags) && data.profile.tags.length > 0) {
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setNeedsOnboarding(true);
      }
    }

    checkOnboarding();
  }, [experienceId]);

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
      
      {needsOnboarding && (
        <div className="container mt-4">
          <div className="rounded-xl bg-muted px-4 py-3 text-sm">
            We need a few details to personalize matches.
            <a 
              className="underline font-semibold ml-2" 
              href={`/experiences/${experienceId}/onboard`}
            >
              Complete onboarding
            </a>
          </div>
        </div>
      )}
      
      {!needsOnboarding && (
        <>
          {tab === "matches" && <Matches experienceId={experienceId} />}
          {tab === "proposals" && <Proposals experienceId={experienceId} />}
          {tab === "analytics" && <Analytics />}
          {tab === "billing" && <Billing />}
        </>
      )}
    </main>
  );
}
