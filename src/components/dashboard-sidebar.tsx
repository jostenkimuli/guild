"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardNavGroup = {
  label: string;
  items: { href: string; label: string }[];
};

export type SidebarHeader = {
  title: string;
  subtitle?: string;
  badge?: string;
  calendarYear?: number | null;
  crestUrl?: string | null;
};

export function DashboardSidebar({
  header,
  groups,
}: {
  header?: SidebarHeader;
  groups: DashboardNavGroup[];
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-muted/40 sm:flex">
      {header ? (
        <div className="border-b px-4 py-4">
          <div className="flex items-center gap-2">
            {header.crestUrl ? (
              <div className="size-9 shrink-0 overflow-hidden rounded-full border bg-surface-container-lowest">
                <img
                  src={header.crestUrl}
                  alt={`${header.title} crest`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            {header.badge ? (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {header.badge}
              </Badge>
            ) : null}
            <Link href="/" className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {header.title}
              </p>
            </Link>
          </div>
          {header.subtitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {header.subtitle}
            </p>
          ) : null}
          {header.calendarYear ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Calendar Year {header.calendarYear}
            </p>
          ) : null}
        </div>
      ) : (
        <Link href="/" className="border-b px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">TheGuild</p>
          <p className="text-xs text-muted-foreground">Your workspace</p>
        </Link>
      )}
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-1.5 text-sm",
                        active
                          ? "bg-secondary font-medium text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            Sign out
          </Button>
        </form>
     </div>
    </aside>
  );
}
