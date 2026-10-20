import Link from "next/link";
import { redirect } from "next/navigation";

import { approveProgramAdmin, approveEcosystemAdmin } from "@/app/actions/console";
import { CreateProgramAdminDialog } from "@/components/console/create-program-admin-dialog";
import { CreateEcosystemAdminBySuperAdminDialog } from "@/components/console/create-ecosystem-admin-super-dialog";
import { CreateEcosystemAdminDialog } from "@/components/console/create-ecosystem-admin-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; approved?: string; delegated?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, can_approve_ecosystem_admins")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const isSuperAdmin = profile.role === "super_admin" && profile.status === "approved";
  const isProgramAdmin = profile.role === "program_admin" && profile.status === "approved";
  if (!isSuperAdmin && !isProgramAdmin) redirect("/");

  const canApproveEco = isSuperAdmin || profile.can_approve_ecosystem_admins;

  const [{ count: pendingProgramCount }, { count: totalProgramCount }] = await Promise.all([
    isSuperAdmin
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "program_admin").eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    isSuperAdmin
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "program_admin")
      : Promise.resolve({ count: 0 }),
  ]);

  const [{ count: pendingEcoCount }, { count: totalEcoCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ecosystem_admin").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ecosystem_admin"),
  ]);

  const { data: pendingProgramRows } = isSuperAdmin
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, created_at")
        .eq("role", "program_admin")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(5)
    : { data: [] };

  const { data: pendingEcoRows } = await supabase
    .from("profiles")
    .select("id, username, display_name, ecosystem_type, created_at")
    .eq("role", "ecosystem_admin")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  const toast =
    params.approved ? "Account approved." :
    params.delegated === "1" ? "Ecosystem-admin approval delegated." :
    params.delegated === "0" ? "Delegation revoked." :
    null;

  const allClear = (pendingProgramCount ?? 0) === 0 && (pendingEcoCount ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isSuperAdmin ? "Manage program admins and ecosystem admins." : "Manage ecosystem admins."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && <CreateProgramAdminDialog />}
          {isSuperAdmin ? <CreateEcosystemAdminBySuperAdminDialog /> : <CreateEcosystemAdminDialog />}
        </div>
      </div>

      {/* Feedback banners */}
      {toast && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          {toast}
        </p>
      )}
      {params.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {params.error}
        </p>
      )}

      {/* Stat cards */}
      <div className={`grid gap-3 ${isSuperAdmin ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
        {isSuperAdmin && (
          <>
            <StatCard
              label="Pending program admins"
              value={pendingProgramCount ?? 0}
              urgent={(pendingProgramCount ?? 0) > 0}
              href="/admin/program-admins?status=pending"
            />
            <StatCard
              label="Total program admins"
              value={totalProgramCount ?? 0}
              href="/admin/program-admins"
            />
          </>
        )}
        <StatCard
          label="Pending ecosystem admins"
          value={pendingEcoCount ?? 0}
          urgent={(pendingEcoCount ?? 0) > 0}
          href="/admin/ecosystem-admins?status=pending"
        />
        <StatCard
          label="Total ecosystem admins"
          value={totalEcoCount ?? 0}
          href="/admin/ecosystem-admins"
        />
      </div>

      {/* Pending program admins */}
      {isSuperAdmin && (pendingProgramRows?.length ?? 0) > 0 && (
        <PendingSection
          title="Pending program admins"
          description="Waiting for your approval before they can create ecosystem admins."
          viewAllHref="/admin/program-admins?status=pending"
          totalPending={pendingProgramCount ?? 0}
        >
          {(pendingProgramRows ?? []).map((admin) => (
            <PendingRow
              key={admin.id}
              id={admin.id}
              name={admin.display_name || admin.username}
              username={admin.username}
              createdAt={admin.created_at}
              action={approveProgramAdmin}
            />
          ))}
        </PendingSection>
      )}

      {/* Pending ecosystem admins */}
      {(pendingEcoRows?.length ?? 0) > 0 && (
        <PendingSection
          title="Pending ecosystem admins"
          description={
            canApproveEco
              ? "Waiting for your approval before they can set up their ecosystem."
              : "Awaiting super admin approval."
          }
          viewAllHref="/admin/ecosystem-admins?status=pending"
          totalPending={pendingEcoCount ?? 0}
        >
          {(pendingEcoRows ?? []).map((admin) => (
            <PendingRow
              key={admin.id}
              id={admin.id}
              name={admin.display_name || admin.username}
              username={admin.username}
              createdAt={admin.created_at}
              badge={admin.ecosystem_type ? ecosystemTypeLabel(admin.ecosystem_type) : undefined}
              action={canApproveEco ? approveEcosystemAdmin : undefined}
              readOnly={!canApproveEco}
            />
          ))}
        </PendingSection>
      )}

      {/* All clear */}
      {allClear && (
        <div className="rounded-lg border bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm font-medium">No pending approvals</p>
          <p className="mt-1 text-xs text-muted-foreground">Everything is up to date.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/ecosystem-admins">View ecosystem admins</Link>
            </Button>
            {isSuperAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/program-admins">View program admins</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  urgent,
  href,
}: {
  label: string;
  value: number;
  urgent?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-lg border p-4 transition-colors ${
        urgent
          ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-background hover:bg-muted/50"
      }`}
    >
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${urgent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className={`mt-2 text-xs underline-offset-2 group-hover:underline ${urgent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
        View all →
      </p>
    </Link>
  );
}

function PendingSection({
  title,
  description,
  viewAllHref,
  totalPending,
  children,
}: {
  title: string;
  description: string;
  viewAllHref: string;
  totalPending: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {totalPending}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View all →
        </Link>
      </div>
      <ul className="divide-y px-4">{children}</ul>
      {totalPending > 5 && (
        <div className="border-t px-4 py-2.5">
          <Link
            href={viewAllHref}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            +{totalPending - 5} more — view all
          </Link>
        </div>
      )}
    </div>
  );
}

function PendingRow({
  id,
  name,
  username,
  createdAt,
  badge,
  action,
  readOnly,
}: {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  badge?: string;
  action?: (formData: FormData) => Promise<void>;
  readOnly?: boolean;
}) {
  const joined = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{username}</span>
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          <span className="text-xs text-muted-foreground">· {joined}</span>
        </div>
      </div>
      {action ? (
        <form action={action} className="shrink-0">
          <input type="hidden" name="user_id" value={id} />
          <Button type="submit" size="sm">Approve</Button>
        </form>
      ) : readOnly ? (
        <Badge variant="outline" className="shrink-0 text-xs">with super admin</Badge>
      ) : null}
    </li>
  );
}
