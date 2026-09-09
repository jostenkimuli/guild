import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { InviteLearnersButton } from "./invite-button";

export default async function EcosystemStudentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin") redirect("/");
  if (profile.status !== "approved") redirect("/");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!ecosystem) notFound();

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, slug, curricula(id, grades(id, name))")
    .eq("ecosystem_id", ecosystem.id)
    .order("name");

  const { data: learnerRows } = await supabase
    .from("space_memberships")
    .select(
      "user_id, role, joined_at, spaces!inner(ecosystem_id, name), profiles(id, display_name, username)",
    )
    .eq("spaces.ecosystem_id", ecosystem.id)
    .eq("role", "learner")
    .order("joined_at", { ascending: false });

  const learners =
    learnerRows
      ?.map((row) => ({
        id: row.user_id,
        name: row.profiles?.display_name || row.profiles?.username || "—",
        spaceName: (row.spaces as { name?: string } | null)?.name ?? "—",
        joinedAt: row.joined_at,
      }))
      .filter((r) => r.id) ?? [];

  const invitationSpaces = (spaces ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    grades: (s.curricula ?? []).flatMap((c) => c.grades ?? []),
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Students
        </h2>
      </div>

      <ConsolePanel
        title={`${learners.length} student${learners.length === 1 ? "" : "s"}`}
        description="Learners enrolled in spaces within this ecosystem."
        footer={
          <InviteLearnersButton spaces={invitationSpaces} />
        }
      >
        {learners.length > 0 ? (
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learners.map((learner) => (
                  <TableRow key={learner.id}>
                    <TableCell className="font-medium">
                      {learner.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{learner.spaceName}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(learner.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState>
            No students enrolled yet. Generate an invitation code to get
            started.
          </EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
