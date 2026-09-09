import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { InviteTeachersButton } from "./invite-button";

export default async function SpaceTeachersPage({
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

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!space) notFound();

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isSpaceAdmin = membership?.role === "admin";
  if (!isSpaceAdmin) redirect(`/spaces/${slug}`);

  const { data: teacherRows } = await supabase
    .from("space_memberships")
    .select("user_id, joined_at, profiles(id, display_name, username)")
    .eq("space_id", space.id)
    .eq("role", "teacher")
    .order("joined_at", { ascending: false });

  const teachers =
    teacherRows
      ?.map((row) => ({
        id: row.user_id,
        name: row.profiles?.display_name || row.profiles?.username || "—",
        username: row.profiles?.username ?? "—",
        joinedAt: row.joined_at,
      }))
      .filter((r) => r.id) ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Teachers</h2>
      </div>

      <ConsolePanel
        title={`${teachers.length} teacher${teachers.length === 1 ? "" : "s"}`}
        description="Teachers assigned to this space."
        footer={
          <InviteTeachersButton spaceId={space.id} spaceName={space.name} />
        }
      >
        {teachers.length > 0 ? (
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {teacher.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {teacher.username}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(teacher.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState>
            No teachers assigned yet. Generate an invitation code to invite
            one.
          </EmptyState>
        )}
      </ConsolePanel>
    </section>
  );
}
