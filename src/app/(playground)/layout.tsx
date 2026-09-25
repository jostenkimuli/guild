import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

const PLAYGROUND_NAV = [
  { href: "/playground", label: "Hub", exact: true },
  { href: "/playground/primitives", label: "Primitives" },
  { href: "/playground/theme", label: "Theme" },
  { href: "/playground/curriculum", label: "Curriculum" },
  { href: "/playground/curriculum-admin", label: "Curriculum admin" },
  { href: "/playground/lesson", label: "Lesson" },
];

export default function PlaygroundLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight">
                TheGuild · UI Playground
              </h1>
              <Badge variant="secondary">dev only</Badge>
            </div>
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to app →
            </Link>
          </div>
          <nav className="flex flex-wrap gap-1">
            {PLAYGROUND_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}