"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardNavGroup = {
  label: string;
  items: { href: string; label: string }[];
  viewAllHref?: string;
  viewAllLabel?: string;
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
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest sm:flex">
      {/* Sidebar header */}
      {header ? (
        <div className="border-b border-outline-variant px-4 py-4">
          <div className="flex items-center gap-2.5">
            {header.crestUrl ? (
              <div className="size-8 shrink-0 overflow-hidden rounded-full border border-outline-variant bg-surface-container">
                <img
                  src={header.crestUrl}
                  alt={`${header.title} crest`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {header.title.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <Link href="/">
                <p className="truncate text-sm font-semibold tracking-tight text-on-surface">
                  {header.title}
                </p>
              </Link>
              {header.badge && (
                <p className="truncate text-xs text-on-surface-variant">{header.badge}</p>
              )}
            </div>
          </div>
          {header.calendarYear ? (
            <p className="mt-2 text-xs text-on-surface-variant">
              Calendar Year {header.calendarYear}
            </p>
          ) : null}
        </div>
      ) : (
        <Link href="/" className="border-b border-outline-variant px-4 py-4">
          <p className="text-sm font-semibold tracking-tight text-on-surface">TheGuild</p>
          <p className="text-xs text-on-surface-variant">Platform console</p>
        </Link>
      )}

      {/* Nav groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {group.viewAllHref && (
              <Link
                href={group.viewAllHref}
                className="mt-0.5 flex items-center rounded-md px-2 py-1.5 text-xs text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface"
              >
                {group.viewAllLabel ?? "View all"} →
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-outline-variant p-3">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-on-surface-variant hover:text-on-surface"
          >
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
