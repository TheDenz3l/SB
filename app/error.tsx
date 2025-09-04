"use client";
import * as React from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { console.error(error); }, [error]);
  return (
    <html>
      <body>
        <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
          <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f6f6f6", borderRadius: 8, padding: 12 }}>{String(error?.message || error)}</pre>
          <button onClick={() => reset()} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#222", color: "#fff" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}

