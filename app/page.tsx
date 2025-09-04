"use client";
import * as React from "react";
import { useIframeSdk } from "@/lib/whop-compat";
import { AppHeader } from "@/components/app/Header";

export default function RootPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const iframeSdk = useIframeSdk();

  React.useEffect(() => {
    let mounted = true;
    
    // Try to get context from Whop SDK and redirect to proper experience page
    iframeSdk.getTopLevelUrlData({}).then((data: any) => {
      if (!mounted) return;
      
      if (data.experienceId) {
        // Redirect to the proper experience page
        window.location.href = `/experiences/${data.experienceId}`;
      } else {
        setError("No experience ID found. Please access this app through Whop.");
        setLoading(false);
      }
    }).catch(() => {
      if (!mounted) return;
      setError("This app must be accessed through Whop. Please open it from your Whop workspace.");
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [iframeSdk]);

  if (loading) {
    return (
      <main>
        <AppHeader title="Swapboard" />
        <div className="container mt-8 text-center">
          <div className="text-sm text-neutral-600">Loading...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <AppHeader title="Swapboard" />
        <div className="container mt-8 text-center">
          <div className="rounded-xl bg-muted px-6 py-4 text-sm max-w-md mx-auto">
            <h2 className="font-semibold mb-2">Access Required</h2>
            <p className="text-neutral-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
