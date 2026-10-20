"use client";

import { useEffect, useRef } from "react";

import { APP_HOST } from "@/lib/subdomain";
import { navigateToEcosystemSubdomain } from "@/lib/subdomain-session";

export function SchoolSubdomainRedirect({
  schoolSlug,
}: {
  schoolSlug: string;
}) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const port = window.location.port ? `:${window.location.port}` : "";
    const schoolOrigin = `${window.location.protocol}//${schoolSlug}.${APP_HOST}${port}`;
    void navigateToEcosystemSubdomain(schoolOrigin);
  }, [schoolSlug]);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Opening your school dashboard…</p>
    </main>
  );
}
