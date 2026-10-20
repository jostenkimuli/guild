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
      "id, slug, name, type, vision, mission, description, raw_ecosystem_meta_data, badge_url, theme_primary, theme_supporting, theme_accent",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!ecosystem) notFound();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  const { data: assignment } = await supabase
    .from("ecosystem_staff")
    .select("user_id")
    .eq("ecosystem_id", ecosystem.id)
    .eq("user_id", user.id)
    .eq("role", "ecosystem_admin")
    .maybeSingle();
  if (profile?.role !== "ecosystem_admin" || profile.status !== "approved" || !assignment) redirect("/");
  if (!isSchoolType(ecosystem.type)) redirect(`/ecosystem/${slug}`);
  const rawMeta = ecosystem.raw_ecosystem_meta_data;
  const profileMeta = rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
    ? Object.fromEntries(Object.entries(rawMeta).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : {};

  return (
    <div className="space-y-6">
      <ThemeEditor ecosystem={{ ...ecosystem, raw_ecosystem_meta_data: profileMeta }} />
    </div>
  );
}
