import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { CreateCurriculumDialog } from "@/components/admin-curriculum/create-curriculum-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAllNationalCurricula } from "@/lib/curriculum/national";
import { ecosystemTypeLabel } from "@/lib/ecosystems";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCurriculaPage() {
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
  const isPlatformAdmin =
    (profile?.role === "super_admin" || profile?.role === "program_admin") &&
    profile?.status === "approved";
  if (!isPlatformAdmin) redirect("/");

  const curricula = await listAllNationalCurricula(supabase);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">National curricula</h2>
          <p className="text-sm text-muted-foreground">
            The read-only reference every school plans against. See{" "}
            <a
              href="https://ncdc.go.ug/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              ncdc.go.ug
            </a>{" "}
            for the source material.
          </p>
        </div>
        <CreateCurriculumDialog />
      </div>

      <ConsolePanel title="All curricula">
        {curricula.length === 0 ? (
          <EmptyState>No national curricula loaded yet.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>School type</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead className="text-right">Themes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {curricula.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/admin/curricula/${c.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.class_level}</Badge>
                  </TableCell>
                  <TableCell>{ecosystemTypeLabel(c.ecosystem_type)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.authority}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.theme_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ConsolePanel>
    </section>
  );
}
