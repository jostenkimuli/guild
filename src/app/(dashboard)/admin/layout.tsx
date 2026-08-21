import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
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
  if (
    !profile ||
    (profile.role !== "super_admin" && profile.role !== "program_admin") ||
    profile.status !== "approved"
  ) {
    redirect("/");
  }

  return <>{children}</>;
}
