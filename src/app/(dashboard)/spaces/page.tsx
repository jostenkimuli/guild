import { redirect } from "next/navigation";

import { SpaceCard } from "@/components/console/spaces";
import { createClient } from "@/lib/supabase/server";

export default async function MySpacesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.status !== "approved") redirect("/");

  let query = supabase
    .from("space_memberships")
    .select("spaces(id, name, type, description, slug)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });
  if (profile.role === "space_admin") query = query.eq("role", "admin");

  const { data: memberships } = await query;
  const spaces = (memberships ?? [])
    .map((membership) => membership.spaces)
    .filter((space): space is NonNullable<typeof space> => space !== null);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">My spaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spaces you manage or belong to.
        </p>
      </div>
      {spaces.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => <SpaceCard key={space.id} space={space} />)}
        </div>
      ) : (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No spaces are assigned to your account yet.
        </p>
      )}
    </section>
  );
}
