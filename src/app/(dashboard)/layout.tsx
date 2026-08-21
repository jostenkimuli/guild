import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  DashboardSidebar,
  type DashboardNavGroup,
  type SidebarHeader,
} from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ecosystemTypeLabel,
  SPACE_TYPE_ORDER,
  type SpaceType,
} from "@/lib/ecosystems";

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
    .select("role, status, must_change_password")
    .eq("id", user.id)
    .single();
  if (profile?.must_change_password) redirect("/setup-password");

  const role = profile?.role;
  const groups: DashboardNavGroup[] = [];
  let header: SidebarHeader | undefined;

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
      .select("id, name, type, vision")
      .eq("created_by", user.id)
      .maybeSingle();
    if (ecosystem) {
      header = {
        title: ecosystem.name,
        subtitle: ecosystem.vision ?? undefined,
        badge: ecosystemTypeLabel(ecosystem.type),
      };
      groups.push({
        label: "Overview",
        items: [{ href: `/ecosystem/${ecosystem.id}`, label: "Dashboard" }],
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
        groups.push({ label: "Departments", items: spaceItems });
      }

      groups.push({
        label: "Administration",
        items: [
          { href: `/ecosystem/${ecosystem.id}/staff`, label: "Staff" },
          { href: `/ecosystem/${ecosystem.id}/members`, label: "Members" },
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
        .select("name, type, vision")
        .eq("id", ecosystemId)
        .maybeSingle();

      if (ecosystem) {
        header = {
          title: ecosystem.name,
          subtitle: ecosystem.vision ?? undefined,
          badge: ecosystemTypeLabel(ecosystem.type),
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
        items: spaces.map((space) => ({
          href: `/spaces/${space.slug ?? space.id}/members`,
          label: "Members",
        })),
      });
    }
  }

  if (role === "member") {
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("spaces(id, name, slug, type)");

    const spacesByType = new Map<SpaceType, { href: string; label: string }[]>();
    for (const membership of memberships ?? []) {
      const space = membership.spaces;
      if (!space) continue;
      const type = space.type as SpaceType;
      const item = { href: `/spaces/${space.slug ?? space.id}`, label: space.name };
      const items = spacesByType.get(type) ?? [];
      if (!items.some((existing) => existing.href === item.href)) {
        items.push(item);
        spacesByType.set(type, items);
      }
    }

    const spaceItems: { href: string; label: string }[] = [];
    for (const type of SPACE_TYPE_ORDER) {
      const items = spacesByType.get(type);
      if (items && items.length > 0) {
        spaceItems.push(...items);
      }
    }

    if (spaceItems.length > 0) {
      groups.push({ label: "Spaces", items: spaceItems });
    }
  }

  const mobileItems = groups.flatMap((group) => group.items);

  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar header={header} groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                TheGuild
              </h1>
              <form action={signOut} className="sm:hidden">
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
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
  );
}
