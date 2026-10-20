import { redirect } from "next/navigation";

import { approveEcosystemAdmin } from "@/app/actions/console";
import { CreateEcosystemAdminBySuperAdminDialog } from "@/components/console/create-ecosystem-admin-super-dialog";
import { CreateEcosystemAdminDialog } from "@/components/console/create-ecosystem-admin-dialog";
import {
  FeedbackBanner,
  FilterBar,
  PageHeader,
  Pagination,
  SearchForm,
  StatusTabs,
  TableWrapper,
  TypeChips,
} from "@/components/console/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

const PAGE_SIZE = 20;
const ECO_TYPES = ["nursery_school", "primary_school", "secondary_school", "university"] as const;

export default async function AdminEcosystemAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string; page?: string; error?: string; approved?: string }>;
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
  if (
    !profile ||
    (profile.role !== "super_admin" && profile.role !== "program_admin") ||
    profile.status !== "approved"
  ) redirect("/");

  const isSuperAdmin = profile.role === "super_admin";
  const isProgramAdmin = profile.role === "program_admin";
  const canApprove = isSuperAdmin || profile.can_approve_ecosystem_admins;

  const status = params.status === "pending" ? "pending" : params.status === "approved" ? "approved" : null;
  const ecoType = ECO_TYPES.find((type) => type === params.type) ?? null;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, status, ecosystem_type, created_at", { count: "exact" })
    .eq("role", "ecosystem_admin")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (ecoType) query = query.eq("ecosystem_type", ecoType);
  if (q) query = query.ilike("username", `%${q}%`);

  const { data: rows, count } = await query;

  const [{ count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ecosystem_admin").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ecosystem_admin").eq("status", "approved"),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      status: status ?? undefined,
      type: ecoType ?? undefined,
      q: q || undefined,
      page: String(page),
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return `/admin/ecosystem-admins${qs ? `?${qs}` : ""}`;
  }

  const hiddenFields: Record<string, string> = {};
  if (status) hiddenFields.status = status;
  if (ecoType) hiddenFields.type = ecoType;

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[{ label: "Overview", href: "/admin" }]}
        title="Ecosystem admins"
        description="All ecosystem administrators across the platform."
        actions={
          isSuperAdmin
            ? <CreateEcosystemAdminBySuperAdminDialog />
            : isProgramAdmin
              ? <CreateEcosystemAdminDialog />
              : undefined
        }
      />

      <FeedbackBanner
        success={params.approved ? "Account approved." : null}
        error={params.error}
      />

      <FilterBar>
        <StatusTabs
          tabs={[
            { label: "All", value: null, count: (pendingCount ?? 0) + (approvedCount ?? 0) },
            { label: "Pending", value: "pending", count: pendingCount ?? 0 },
            { label: "Approved", value: "approved", count: approvedCount ?? 0 },
          ]}
          active={status}
          buildHref={buildHref}
        />
        <div className="h-4 w-px bg-border" />
        <TypeChips
          types={ECO_TYPES.map((t) => ({ label: ecosystemTypeLabel(t), value: t }))}
          active={ecoType ?? null}
          buildHref={buildHref}
        />
        <SearchForm
          action="/admin/ecosystem-admins"
          defaultValue={q}
          hiddenFields={hiddenFields}
          buildHref={buildHref}
        />
      </FilterBar>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No ecosystem admins found.
                </TableCell>
              </TableRow>
            ) : (
              (rows ?? []).map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.display_name || admin.username}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{admin.username}</TableCell>
                  <TableCell>
                    {admin.ecosystem_type ? (
                      <Badge variant="outline">{ecosystemTypeLabel(admin.ecosystem_type)}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.status === "approved" ? "secondary" : "outline"}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {admin.status === "pending" && canApprove ? (
                      <form action={approveEcosystemAdmin}>
                        <input type="hidden" name="user_id" value={admin.id} />
                        <Button type="submit" size="sm">Approve</Button>
                      </form>
                    ) : admin.status === "pending" ? (
                      <Badge variant="outline" className="text-xs">with super admin</Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      <Pagination
        page={page}
        totalPages={totalPages}
        from={from}
        to={to}
        count={count ?? 0}
        buildHref={buildHref}
      />
    </div>
  );
}
