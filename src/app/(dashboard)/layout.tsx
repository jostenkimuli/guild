import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  DashboardSidebar,
  type DashboardNavGroup,
  type SidebarHeader,
} from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/app/actions/auth";
import { EcosystemThemeProvider } from "@/components/ecosystem-theme-provider";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel, isSchoolType } from "@/lib/ecosystems";
import {
  themeConfigFromRow,
  type EcosystemThemeConfig,
} from "@/lib/theme";

export default async function DashboardRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, must_change_password, display_name")
    .eq("id", user.id)
    .single();
  if (profile?.must_change_password) redirect("/setup-password");

  const role = profile?.role;
  const initials = (profile?.display_name || user.email || "?")
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const groups: DashboardNavGroup[] = [];
  let header: SidebarHeader | undefined;
  let themeConfig: EcosystemThemeConfig | null = null;

  if (
    (role === "super_admin" || role === "program_admin") &&
    profile?.status === "approved"
  ) {
    groups.push({
      label: "Overview",
      items: [{ href: "/admin", label: "Admin" }],
    });
  }

  if (role === "ecosystem_admin" && profile?.status === "approved") {
    const { data: ecosystem } = await supabase
      .from("ecosystems")
      .select(
        "id, slug, name, type, vision, calendar_year, badge_url, theme_primary, theme_supporting, theme_accent",
      )
      .eq("created_by", user.id)
      .maybeSingle();
    if (ecosystem) {
      const school = isSchoolType(ecosystem.type);
      if (school) themeConfig = themeConfigFromRow(ecosystem);
      header = {
        title: ecosystem.name,
        subtitle: ecosystem.vision ?? undefined,
        badge: ecosystemTypeLabel(ecosystem.type),
        calendarYear: ecosystem.calendar_year,
        crestUrl: school ? ecosystem.badge_url : undefined,
      };
      groups.push({
        label: "Overview",
        items: [{ href: `/ecosystem/${ecosystem.slug}`, label: "Dashboard" }],
      });

      const { data: spaces } = await supabase
        .from("spaces")
        .select("id, name, slug, type")
        .eq("ecosystem_id", ecosystem.id)
        .order("type");

      const spaceItems = (spaces ?? []).map((space) => ({
        href: `/spaces/${space.slug ?? space.id}`,
        label: space.name,
      }));
      if (spaceItems.length > 0) {
        groups.push({
          label: school ? "Classes" : "Departments",
          items: spaceItems,
        });
      }

      groups.push({
        label: school ? "School" : "Administration",
        items: [
          ...(school
            ? [{ href: `/ecosystem/${ecosystem.slug}/students`, label: "Students" }]
            : []),
          { href: `/ecosystem/${ecosystem.slug}/staff`, label: school ? "Teachers" : "Staff" },
          { href: `/ecosystem/${ecosystem.slug}/members`, label: "Members" },
          ...(school
            ? [{ href: `/ecosystem/${ecosystem.slug}/settings`, label: "Settings" }]
            : []),
        ],
      });
    } else {
      groups.push({
        label: "Overview",
        items: [{ href: "/ecosystem", label: "Create ecosystem" }],
      });
    }
  }

  if (role === "space_admin" && profile?.status === "approved") {
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("spaces(id, name, slug, type, ecosystem_id)")
      .eq("user_id", user.id);

    const spaces = (memberships ?? [])
      .map((m) => m.spaces)
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (spaces.length > 0) {
      const ecosystemId = spaces[0].ecosystem_id;
      const { data: ecosystem } = await supabase
        .from("ecosystems")
        .select("name, type, vision, calendar_year")
        .eq("id", ecosystemId)
        .maybeSingle();

      if (ecosystem) {
        header = {
          title: ecosystem.name,
          subtitle: ecosystem.vision ?? undefined,
          badge: ecosystemTypeLabel(ecosystem.type),
          calendarYear: ecosystem.calendar_year,
        };
      }

      groups.push({
        label: "Overview",
        items: spaces.map((space) => ({
          href: `/spaces/${space.slug ?? space.id}`,
          label: "Dashboard",
        })),
      });

      groups.push({
        label: "Administration",
        items: [
          ...spaces.map((space) => ({
            href: `/spaces/${space.slug ?? space.id}/members`,
            label: "Members",
          })),
          ...spaces.map((space) => ({
            href: `/spaces/${space.slug ?? space.id}/teachers`,
            label: "Teachers",
          })),
        ],
      });
    }
  }

  if (role === "member") {
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("spaces(id, slug)")
      .limit(1)
      .maybeSingle();

    const space = memberships?.spaces;
    if (space) {
      groups.push({
        label: "Overview",
        items: [{ href: `/spaces/${space.slug ?? space.id}`, label: "Dashboard" }],
      });
    }
  }

  const mobileItems = groups.flatMap((group) => group.items);

  return (
    <EcosystemThemeProvider config={themeConfig}>
      <div className="flex min-h-dvh">
      <DashboardSidebar header={header} groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                TheGuild
              </h1>
              <div className="flex items-center gap-3">
                <div className="group/avatar-chip relative">
                  <Avatar className="cursor-default">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="pointer-events-none absolute top-full right-0 z-50 mt-2 rounded-md border bg-popover px-3 py-1.5 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/avatar-chip:opacity-100">
                    {user.email}
                  </div>
                </div>
                <form action={signOut} className="sm:hidden">
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-3 sm:hidden">
              {mobileItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
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
      </div>
    </EcosystemThemeProvider>
  );
}
