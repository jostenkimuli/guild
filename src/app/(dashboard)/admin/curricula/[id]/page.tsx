import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CurriculumEditor } from "@/components/admin-curriculum/curriculum-editor";
import { loadNationalCurriculum } from "@/lib/curriculum/national";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCurriculumEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const curriculum = await loadNationalCurriculum(supabase, id);
  if (!curriculum) notFound();

  return (
    <section className="space-y-4">
      <Link
        href="/admin/curricula"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        &larr; All national curricula
      </Link>
      <CurriculumEditor curriculum={curriculum} />
    </section>
  );
}
