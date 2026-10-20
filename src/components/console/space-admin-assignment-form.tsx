"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { setSpaceAdminAssignments } from "@/app/actions/console";
import type { ConsoleActionState } from "@/app/actions/console";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/console/forms";

export function SpaceAdminAssignmentForm({
  ecosystemId,
  userId,
  spaces,
  assignedSpaceIds,
}: {
  ecosystemId: string;
  userId: string;
  spaces: { id: string; name: string }[];
  assignedSpaceIds: string[];
}) {
  const [state, action, pending] = useActionState<ConsoleActionState, FormData>(
    setSpaceAdminAssignments,
    { success: false },
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={action} className="mt-3 space-y-3 rounded-md border p-3">
      <input type="hidden" name="ecosystem_id" value={ecosystemId} />
      <input type="hidden" name="user_id" value={userId} />
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium">Spaces this admin manages</legend>
        {spaces.length ? spaces.map((space) => (
          <label key={space.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="space_ids"
              value={space.id}
              defaultChecked={assignedSpaceIds.includes(space.id)}
              className="size-4 rounded border-input accent-primary"
            />
            {space.name}
          </label>
        )) : (
          <p className="text-xs text-muted-foreground">Create a space before assigning an admin.</p>
        )}
      </fieldset>
      <Feedback state={state} />
      <Button type="submit" size="sm" variant="outline" disabled={pending || spaces.length === 0}>
        {pending ? "Saving…" : "Save assignments"}
      </Button>
    </form>
  );
}
