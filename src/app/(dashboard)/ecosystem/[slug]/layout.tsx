import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

export default async function EcosystemDetailLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "ecosystem_admin") redirect("/");
  if (profile.status !== "approved") redirect("/");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, slug, name, type, vision, mission, description, created_by")
    .eq("slug", slug)
    .maybeSingle();

  if (!ecosystem) notFound();

  if (ecosystem.created_by !== user.id) redirect("/");

  return <>{children}</>;
}
