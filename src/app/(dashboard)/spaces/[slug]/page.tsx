import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ecosystemDisplayName } from "@/lib/ecosystems";
import { SpaceEditForm } from "@/components/console/SpaceEditForm";
import {
  approveSpaceEdit,
  rejectSpaceEdit,
} from "@/app/actions/console";

export default async function SpacePage({
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
    .select("id, name, slug, type, description, ecosystem_id, ecosystems(name, type)")
    .eq("slug", slug)
    .maybeSingle();

  if (!space) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Space not found</CardTitle>
            <CardDescription>
              The space you are looking for does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isMember = membership !== null;
  const isSpaceAdmin = membership?.role === "admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  const isEcosystemAdmin =
    profile?.role === "ecosystem_admin" && profile?.status === "approved";

  let pendingEdits: PendingEdit[] = [];
  if (isEcosystemAdmin) {
    const { data } = await supabase
      .from("space_edits")
      .select(
        "id, created_at, changes, profiles!space_edits_edited_by_fkey(display_name)",
      )
      .eq("space_id", space.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    pendingEdits = data ?? [];
  }

  const { data: memberships } = await supabase
    .from("space_memberships")
    .select("role, profiles(display_name)")
    .eq("space_id", space.id);

  const { data: latestEdit } = await supabase
    .from("space_edits")
    .select("id, status, created_at, changes")
    .eq("space_id", space.id)
    .eq("edited_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {space.name}
            </h1>
            <Badge variant="secondary">{space.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {space.ecosystems
              ? ecosystemDisplayName(space.ecosystems)
              : "Unknown ecosystem"}
            {space.description ? ` · ${space.description}` : ""}
          </p>
        </div>
      </header>

      {isEcosystemAdmin ? <PendingSpaceEdits edits={pendingEdits} /> : null}

      {!isMember && !isEcosystemAdmin ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Join this space</CardTitle>
            <CardDescription>
              You are not a member yet. Ask a teacher or admin for an
              invitation code to participate in this space.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {isSpaceAdmin ? (
            <div className="mt-8">
              <SpaceEditForm space={space} latestEdit={latestEdit} />
            </div>
          ) : null}

          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Members
            </h2>
            <Card>
              <CardContent className="pt-6">
                {memberships && memberships.length > 0 ? (
                  <ul className="divide-y">
                    {memberships.map((membership) => (
                      <li
                        key={`${membership.profiles?.display_name}-${membership.role}`}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm font-medium">
                          {membership.profiles?.display_name ?? "A member"}
                        </span>
                        <Badge variant="secondary">{membership.role}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No members yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

type PendingEdit = {
  id: string;
  created_at: string;
  changes: unknown;
  profiles: { display_name: string } | null;
};

function PendingSpaceEdits({ edits }: { edits: PendingEdit[] }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Pending space edit requests
      </h2>
      {edits.length > 0 ? (
        edits.map((edit) => {
          const changes = (edit.changes ?? {}) as Record<string, unknown>;
          const requested = Object.entries(changes).filter(
            ([, value]) => typeof value === "string" && value.length > 0,
          );
          return (
            <Card key={edit.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {edit.profiles?.display_name ?? "A space admin"} requested an
                  edit
                </CardTitle>
                <CardDescription>
                  Submitted {formatDate(edit.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {requested.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {requested.map(([field, value]) => (
                      <li key={field}>
                        <span className="font-medium capitalize">
                          {field}:
                        </span>{" "}
                        {String(value)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex gap-2">
                  <form action={approveSpaceEdit}>
                    <input type="hidden" name="edit_id" value={edit.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectSpaceEdit}>
                    <input type="hidden" name="edit_id" value={edit.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Reject
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              No pending edit requests
            </CardTitle>
            <CardDescription>
              Space admin edit requests for this space will appear here for
              your approval.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}