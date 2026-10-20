"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { manageSpaceMembership } from "@/app/actions/console";
import type { ConsoleActionState } from "@/app/actions/console";
import { Feedback } from "@/components/console/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roles = [
  ["learner", "Student / learner"],
  ["teacher", "Teacher"],
  ["mentor", "Mentor"],
  ["collaborator", "Collaborator"],
] as const;

type SpaceOption = { id: string; name: string };
type UserOption = { id: string; name: string; username: string };
type MembershipRow = UserOption & {
  spaceId: string;
  spaceName: string;
  role: string;
};

function useRefreshAfterSuccess(state: ConsoleActionState) {
  const router = useRouter();
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);
}

function RoleSelect({ defaultValue = "learner" }: { defaultValue?: string }) {
  return (
    <select
      name="role"
      defaultValue={defaultValue}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
    >
      {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  );
}

export function SpaceMembershipManager({
  spaces,
  users,
  memberships,
}: {
  spaces: SpaceOption[];
  users: UserOption[];
  memberships: MembershipRow[];
}) {
  const [state, action, pending] = useActionState<ConsoleActionState, FormData>(
    manageSpaceMembership,
    { success: false },
  );
  useRefreshAfterSuccess(state);

  return (
    <div className="space-y-6">
      <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="grid min-w-48 flex-1 gap-1.5">
          <label htmlFor="assign-user" className="text-sm font-medium">Existing member</label>
          <select id="assign-user" name="user_id" required defaultValue="" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="" disabled>Select a person</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.username})</option>)}
          </select>
        </div>
        <div className="grid min-w-40 flex-1 gap-1.5">
          <label htmlFor="assign-space" className="text-sm font-medium">Space</label>
          <select id="assign-space" name="target_space_id" required defaultValue="" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="" disabled>Select a space</option>
            {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
          </select>
        </div>
        <RoleSelect />
        <Button type="submit" size="sm" disabled={pending || users.length === 0 || spaces.length === 0}>
          {pending ? "Assigning…" : "Assign member"}
        </Button>
        <div className="w-full"><Feedback state={state} /></div>
      </form>

      {memberships.length ? (
        <ul className="divide-y divide-outline-variant rounded-lg border bg-card">
          {memberships.map((member) => (
            <li key={`${member.id}-${member.spaceId}`} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-48">
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.username} · {member.spaceName}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                {member.role === "admin" ? (
                  <p className="text-xs text-muted-foreground">Manage admin assignments under Staff.</p>
                ) : (
                  <MembershipActions member={member} spaces={spaces} />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No members enrolled yet.</p>
      )}
    </div>
  );
}

function MembershipActions({ member, spaces }: { member: MembershipRow; spaces: SpaceOption[] }) {
  const [state, action, pending] = useActionState<ConsoleActionState, FormData>(
    manageSpaceMembership,
    { success: false },
  );
  useRefreshAfterSuccess(state);

  const [removeState, removeAction, removePending] = useActionState<ConsoleActionState, FormData>(
    manageSpaceMembership,
    { success: false },
  );
  useRefreshAfterSuccess(removeState);

  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="source_space_id" value={member.spaceId} />
        <input type="hidden" name="user_id" value={member.id} />
        <select name="target_space_id" defaultValue={member.spaceId} className="h-9 max-w-52 rounded-md border border-input bg-background px-2 text-sm">
          {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
        </select>
        <RoleSelect defaultValue={member.role} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Move / update"}
        </Button>
      </form>
      <form action={removeAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="source_space_id" value={member.spaceId} />
        <input type="hidden" name="user_id" value={member.id} />
        <input type="hidden" name="role" value={member.role} />
        <Button type="submit" size="sm" variant="ghost" disabled={removePending}>
          {removePending ? "Removing…" : "Remove from space"}
        </Button>
      </form>
      <Feedback state={state} />
      <Feedback state={removeState} />
    </div>
  );
}
