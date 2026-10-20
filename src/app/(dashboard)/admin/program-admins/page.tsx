import { redirect } from "next/navigation";

import { approveProgramAdmin, setProgramAdminDelegation } from "@/app/actions/console";
import { CreateProgramAdminDialog } from "@/components/console/create-program-admin-dialog";
import {
  FeedbackBanner,
  FilterBar,
  PageHeader,
  Pagination,
  SearchForm,
  StatusTabs,
  TableWrapper,
} from "@/components/console/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export default async function AdminProgramAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; error?: string; approved?: string; delegated?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "super_admin" || profile.status !== "approved") redirect("/");

  const status = params.status === "pending" ? "pending" : params.status === "approved" ? "approved" : null;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, status, can_approve_ecosystem_admins, created_at", { count: "exact" })
    .eq("role", "program_admin")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("username", `%${q}%`);

  const { data: rows, count } = await query;

  const [{ count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "program_admin").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "program_admin").eq("status", "approved"),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const toast =
    params.approved ? "Account approved." :
    params.delegated === "1" ? "Delegation granted." :
    params.delegated === "0" ? "Delegation revoked." :
    null;

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { status: status ?? undefined, q: q || undefined, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return `/admin/program-admins${qs ? `?${qs}` : ""}`;
  }

  const hiddenFields: Record<string, string> = {};
  if (status) hiddenFields.status = status;

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[{ label: "Overview", href: "/admin" }]}
        title="Program admins"
        description="Program admins create and manage ecosystem admins."
        actions={<CreateProgramAdminDialog />}
      />

      <FeedbackBanner success={toast} error={params.error} />

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
        <SearchForm
          action="/admin/program-admins"
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
              <TableHead>Status</TableHead>
              <TableHead>Delegation</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No program admins found.
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
                    <Badge variant={admin.status === "approved" ? "secondary" : "outline"}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.status === "approved" ? (
                      <form action={setProgramAdminDelegation}>
                        <input type="hidden" name="user_id" value={admin.id} />
                        <input type="hidden" name="delegated" value={admin.can_approve_ecosystem_admins ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`text-xs underline-offset-4 hover:underline ${
                            admin.can_approve_ecosystem_admins
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {admin.can_approve_ecosystem_admins ? "✓ Delegated · Revoke" : "Delegate approvals"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {admin.status === "pending" && (
                      <form action={approveProgramAdmin}>
                        <input type="hidden" name="user_id" value={admin.id} />
                        <Button type="submit" size="sm">Approve</Button>
                      </form>
                    )}
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
