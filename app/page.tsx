"use client";
import * as React from "react";

export default function RootPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <main className="p-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Swapboard</h1>
        <div className="rounded-xl bg-gray-100 px-6 py-4 text-sm">
          <h2 className="font-semibold mb-2">Welcome to Swapboard</h2>
          <p className="text-gray-600 mb-4">
            This app is designed to work within the Whop platform. 
            Please access it through your Whop workspace.
          </p>
          <p className="text-xs text-gray-500">
            If you&apos;re seeing this page, the app is working correctly but needs to be accessed through the proper Whop experience URL.
          </p>
        </div>
      </div>
    </main>
  );
}
