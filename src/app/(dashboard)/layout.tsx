import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import {
  DashboardSidebar,
  type DashboardNavGroup,
  type SidebarHeader,
} from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { EcosystemThemeProvider } from "@/components/ecosystem-theme-provider";
import { createClient } from "@/lib/supabase/server";
import { ecosystemSlugFromHost } from "@/lib/subdomain";
import { SchoolSubdomainRedirect } from "@/components/console/school-subdomain-redirect";
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
      items: [
        { href: "/admin", label: "Overview" },
      ],
    });
    groups.push({
      label: "People",
      items: [
        ...(role === "super_admin" ? [{ href: "/admin/program-admins", label: "Program admins" }] : []),
        { href: "/admin/ecosystem-admins", label: "Ecosystem admins" },
      ],
    });
    groups.push({
      label: "Curriculum",
      items: [{ href: "/admin/curricula", label: "National Curricula" }],
    });
  }

  if (role === "ecosystem_admin" && profile?.status === "approved") {
    const { data: staffAssignment } = await supabase
      .from("ecosystem_staff")
      .select("ecosystem_id")
      .eq("user_id", user.id)
      .eq("role", "ecosystem_admin")
      .limit(1)
      .maybeSingle();
    const { data: ecosystem } = staffAssignment
      ? await supabase
          .from("ecosystems")
          .select("id, slug, name, type, vision, calendar_year, badge_url, theme_primary, theme_supporting, theme_accent")
          .eq("id", staffAssignment.ecosystem_id)
          .maybeSingle()
      : { data: null };
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

      groups.push({
        label: "Curriculum",
        items: [
          {
            href: `/ecosystem/${ecosystem.slug}/curriculum`,
            label: "National Curriculum",
          },
          {
            href: `/ecosystem/${ecosystem.slug}/implementation`,
            label: "Implementation",
          },
        ],
      });

      const { data: spaces } = await supabase
        .from("spaces")
        .select("id, name, slug, type")
        .eq("ecosystem_id", ecosystem.id)
        .order("type");

      const allSpaces = spaces ?? [];
      const previewSpaces = allSpaces.slice(0, 5);
      const spaceItems = previewSpaces.map((space) => ({
        href: `/spaces/${space.slug ?? space.id}`,
        label: space.name,
      }));
      if (allSpaces.length > 0) {
        groups.push({
          label: school ? "Classes" : "Spaces",
          items: spaceItems,
          ...(allSpaces.length > 5 && {
            viewAllHref: `/ecosystem/${ecosystem.slug}/spaces`,
            viewAllLabel: `All ${allSpaces.length} spaces`,
          }),
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
      .eq("user_id", user.id)
      .eq("role", "admin")
      .order("joined_at", { ascending: true });

    const spaces = (memberships ?? [])
      .map((m) => m.spaces)
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (spaces.length > 0) {
      const currentSchoolSlug = ecosystemSlugFromHost(
        (await headers()).get("host"),
      );
      const ecosystemIds = [...new Set(spaces.map((space) => space.ecosystem_id))];
      const { data: ecosystems } = await supabase
        .from("ecosystems")
        .select("slug, name, type, vision, calendar_year, badge_url, theme_primary, theme_supporting, theme_accent")
        .in("id", ecosystemIds);
      const ecosystem =
        ecosystems?.find((item) => item.slug === currentSchoolSlug) ??
        ecosystems?.[0] ??
        null;

      if (ecosystem) {
        if (currentSchoolSlug !== ecosystem.slug) {
          return <SchoolSubdomainRedirect schoolSlug={ecosystem.slug} />;
        }

        header = {
          title: ecosystem.name,
          subtitle: ecosystem.vision ?? undefined,
          badge: ecosystemTypeLabel(ecosystem.type),
          calendarYear: ecosystem.calendar_year,
          crestUrl: isSchoolType(ecosystem.type)
            ? ecosystem.badge_url
            : undefined,
        };
        if (isSchoolType(ecosystem.type)) {
          themeConfig = themeConfigFromRow(ecosystem);
        }
      }

      const previewSpaces = spaces.slice(0, 5);

      groups.push({
        label: "Spaces",
        items: previewSpaces.map((space) => ({
          href: `/spaces/${space.slug ?? space.id}`,
          label: space.name,
        })),
        ...(spaces.length > 5 && {
          viewAllHref: `/spaces`,
          viewAllLabel: `All ${spaces.length} spaces`,
        }),
      });

      if (previewSpaces.length > 0) {
        groups.push({
          label: "Administration",
          items: previewSpaces.flatMap((space) => {
            const spacePath = `/spaces/${space.slug ?? space.id}`;
            return [
              { href: `${spacePath}/members`, label: `${space.name}: Members` },
              { href: `${spacePath}/teachers`, label: `${space.name}: Teachers` },
            ];
          }),
        });
      }
    }
  }

  if (role === "member") {
    const { data: memberships } = await supabase
      .from("space_memberships")
      .select("spaces(id, name, slug)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true });

    const spaces = (memberships ?? [])
      .map((membership) => membership.spaces)
      .filter((space): space is NonNullable<typeof space> => space !== null);
    if (spaces.length > 0) {
      groups.push({
        label: "My spaces",
        items: spaces.map((space) => ({
          href: `/spaces/${space.slug ?? space.id}`,
          label: space.name ?? "Space",
        })),
      });
    }
  }

  const mobileItems = groups.flatMap((group) => group.items);

  return (
    <EcosystemThemeProvider config={themeConfig}>
      <div className="flex min-h-dvh">
      <DashboardSidebar header={header} groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between gap-4">
              {/* Brand / role context */}
              <Link href="/" className="flex items-center gap-2 sm:hidden">
                {header?.crestUrl ? (
                  <img
                    src={header.crestUrl}
                    alt={`${header.title} crest`}
                    className="size-7 rounded-full object-cover"
                  />
                ) : null}
                <span className="text-sm font-semibold tracking-tight text-on-surface">
                  {header?.title ?? "TheGuild"}
                </span>
              </Link>
              <div className="hidden sm:block" />

              {/* Right side */}
              <div className="flex items-center gap-3">
                <div className="group/avatar-chip relative">
                  <div className="flex size-8 cursor-default items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="pointer-events-none absolute top-full right-0 z-50 mt-2 min-w-max rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface opacity-0 shadow-md transition-opacity group-hover/avatar-chip:opacity-100">
                    <p className="font-medium">{profile?.display_name ?? ""}</p>
                    <p className="text-on-surface-variant">{user.email}</p>
                  </div>
                </div>
                <form action={signOut} className="sm:hidden">
                  <Button type="submit" variant="ghost" size="sm" className="text-on-surface-variant">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>

            {/* Mobile nav */}
            <nav className="flex gap-1.5 overflow-x-auto pb-3 sm:hidden">
              {mobileItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface"
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
