import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSchoolType } from "@/lib/ecosystems";
import { ThemeEditor } from "@/components/ecosystem/theme-editor";

export default async function SettingsPage({
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

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select(
      "id, slug, name, type, vision, mission, badge_url, theme_primary, theme_supporting, theme_accent, created_by",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!ecosystem) notFound();
  if (ecosystem.created_by !== user.id) redirect("/");
  if (!isSchoolType(ecosystem.type)) redirect(`/ecosystem/${slug}`);

  return (
    <div className="space-y-6">
      <ThemeEditor ecosystem={ecosystem} />
    </div>
  );
}