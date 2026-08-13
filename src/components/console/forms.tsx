"use client";

import { useEffect, useActionState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  createEcosystem,
  createEcosystemAdmin,
  createInvitationCode,
  createSpace,
  createSpaceAdmin,
} from "@/app/actions/console";
import type { ConsoleActionState } from "@/app/actions/console";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const roleOptions = [
  { value: "learner", label: "Learner" },
  { value: "collaborator", label: "Collaborator" },
  { value: "teacher", label: "Teacher" },
  { value: "mentor", label: "Mentor" },
  { value: "admin", label: "Admin" },
];

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Feedback({ state }: { state: ConsoleActionState }) {
  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
        Done. {state.code ? `New invitation code: ${state.code}` : ""}
      </p>
    );
  }
  if (state.error) {
    return <p className="text-sm text-destructive">{state.error}</p>;
  }
  return null;
}

function useRefreshOnSuccess(state: ConsoleActionState) {
  const router = useRouter();
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);
}

export function CreateEcosystemAdminForm() {
  const [state, action, pending] = useActionState(createEcosystemAdmin, {
    success: false,
  });
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="space-y-4">
      <Field id="ea-full_name" label="Full name">
        <Input id="ea-full_name" name="full_name" autoComplete="name" />
      </Field>
      <Field id="ea-email" label="Email">
        <Input id="ea-email" name="email" type="email" required autoComplete="off" />
      </Field>
      <Field
        id="ea-temp_password"
        label="Temporary password"
        hint="The account is created as pending and must change this password on first login."
      >
        <Input
          id="ea-temp_password"
          name="temp_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </Field>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        Create ecosystem admin
      </Button>
    </form>
  );
}

export function CreateSpaceAdminForm({ ecosystemId }: { ecosystemId: string }) {
  const [state, action, pending] = useActionState(createSpaceAdmin, {
    success: false,
  });
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="ecosystem_id" value={ecosystemId} />
      <Field id="sa-full_name" label="Full name">
        <Input id="sa-full_name" name="full_name" autoComplete="name" />
      </Field>
      <Field id="sa-email" label="Email">
        <Input id="sa-email" name="email" type="email" required autoComplete="off" />
      </Field>
      <Field
        id="sa-temp_password"
        label="Temporary password"
        hint="The account can sign in immediately and must set its own password on first login."
      >
        <Input
          id="sa-temp_password"
          name="temp_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </Field>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        Create space admin
      </Button>
    </form>
  );
}

export function CreateEcosystemForm() {
  const [state, action, pending] = useActionState(createEcosystem, {
    success: false,
  });
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="eco-name" label="Name">
          <Input id="eco-name" name="name" required />
        </Field>
        <Field id="eco-type" label="Type">
          <select id="eco-type" name="type" className={selectClass} defaultValue="school">
            <option value="school">School</option>
            <option value="university">University</option>
            <option value="organization">Organization</option>
            <option value="macro_alliance">Macro alliance</option>
          </select>
        </Field>
      </div>
      <Field id="eco-vision" label="Vision">
        <Textarea id="eco-vision" name="vision" />
      </Field>
      <Field id="eco-mission" label="Mission">
        <Textarea id="eco-mission" name="mission" />
      </Field>
      <Field id="eco-description" label="Description">
        <Textarea id="eco-description" name="description" />
      </Field>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">School details (metadata)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="m-director_name" label="Director name">
            <Input id="m-director_name" name="director_name" />
          </Field>
          <Field id="m-director_contact" label="Director contact">
            <Input id="m-director_contact" name="director_contact" />
          </Field>
          <Field id="m-director_email" label="Director email">
            <Input id="m-director_email" name="director_email" type="email" />
          </Field>
          <Field id="m-headteacher_name" label="Headteacher name">
            <Input id="m-headteacher_name" name="headteacher_name" />
          </Field>
          <Field id="m-headteacher_contact" label="Headteacher contact">
            <Input id="m-headteacher_contact" name="headteacher_contact" />
          </Field>
          <Field id="m-headteacher_email" label="Headteacher email">
            <Input id="m-headteacher_email" name="headteacher_email" type="email" />
          </Field>
          <div className="sm:col-span-2">
            <Field id="m-school_location" label="School location">
              <Input id="m-school_location" name="school_location" />
            </Field>
          </div>
        </div>
      </div>

      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        Create ecosystem
      </Button>
    </form>
  );
}

export function CreateSpaceForm({ ecosystemId }: { ecosystemId: string }) {
  const [state, action, pending] = useActionState(createSpace, {
    success: false,
  });
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="ecosystem_id" value={ecosystemId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="sp-name" label="Name">
          <Input id="sp-name" name="name" required />
        </Field>
        <Field id="sp-type" label="Type">
          <select id="sp-type" name="type" className={selectClass} defaultValue="classroom">
            <option value="classroom">Classroom</option>
            <option value="innovation_hub">Innovation hub</option>
            <option value="project_group">Project group</option>
          </select>
        </Field>
      </div>
      <Field id="sp-slug" label="Slug" hint="Optional; generated from the name if left blank.">
        <Input id="sp-slug" name="slug" />
      </Field>
      <Field id="sp-description" label="Description">
        <Textarea id="sp-description" name="description" />
      </Field>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        Create space
      </Button>
    </form>
  );
}

export function InviteCodeForm({ spaceId }: { spaceId: string }) {
  const [state, action, pending] = useActionState(createInvitationCode, {
    success: false,
  });
  useRefreshOnSuccess(state);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="space_id" value={spaceId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="ic-role" label="Role the code grants">
          <select id="ic-role" name="role" className={selectClass} defaultValue="learner">
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ic-max_uses" label="Max uses" hint="Blank = unlimited">
          <Input id="ic-max_uses" name="max_uses" type="number" min={1} inputMode="numeric" />
        </Field>
        <Field id="ic-expires" label="Valid for (days)" hint="Blank = never expires">
          <Input id="ic-expires" name="expires_in_days" type="number" min={1} inputMode="numeric" />
        </Field>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        Generate invitation code
      </Button>
    </form>
  );
}
