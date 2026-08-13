"use client";

import { useEffect, useActionState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  createEcosystem,
  createEcosystemAdmin,
  createInvitationCode,
  createProgramAdmin,
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

function CreateAdminAccountForm({
  idPrefix,
  action,
  actionLabel,
  hint,
  ecosystemId,
}: {
  idPrefix: string;
  action: (
    _: ConsoleActionState,
    formData: FormData,
  ) => Promise<ConsoleActionState>;
  actionLabel: string;
  hint: string;
  ecosystemId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    success: false,
  });
  useRefreshOnSuccess(state);

  return (
    <form action={formAction} className="space-y-4">
      {ecosystemId ? (
        <input type="hidden" name="ecosystem_id" value={ecosystemId} />
      ) : null}
      <Field id={`${idPrefix}-full_name`} label="Full name">
        <Input
          id={`${idPrefix}-full_name`}
          name="full_name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </Field>
      <Field id={`${idPrefix}-email`} label="Email">
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          required
          maxLength={120}
          autoComplete="off"
        />
      </Field>
      <Field id={`${idPrefix}-temp_password`} label="Temporary password" hint={hint}>
        <Input
          id={`${idPrefix}-temp_password`}
          name="temp_password"
          type="password"
          required
          minLength={6}
          maxLength={72}
          autoComplete="new-password"
        />
      </Field>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {actionLabel}
      </Button>
    </form>
  );
}

export function CreateProgramAdminForm() {
  return (
    <CreateAdminAccountForm
      idPrefix="pa"
      action={createProgramAdmin}
      actionLabel="Create program admin"
      hint="The account starts pending and must be approved by the super admin before it can create ecosystem admins."
    />
  );
}

export function CreateEcosystemAdminForm() {
  return (
    <CreateAdminAccountForm
      idPrefix="ea"
      action={createEcosystemAdmin}
      actionLabel="Create ecosystem admin"
      hint="The account starts pending. Approval is decided by the super admin, or by the program admin if the super admin has delegated approval to them."
    />
  );
}

export function CreateSpaceAdminForm({ ecosystemId }: { ecosystemId: string }) {
  return (
    <CreateAdminAccountForm
      idPrefix="sa"
      action={createSpaceAdmin}
      actionLabel="Create space admin"
      hint="The account can sign in immediately and must set its own password on first login."
      ecosystemId={ecosystemId}
    />
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
          <Input
            id="eco-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
          />
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
        <Textarea id="eco-vision" name="vision" maxLength={1000} />
      </Field>
      <Field id="eco-mission" label="Mission">
        <Textarea id="eco-mission" name="mission" maxLength={1000} />
      </Field>
      <Field id="eco-description" label="Description">
        <Textarea id="eco-description" name="description" maxLength={1000} />
      </Field>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">School details (metadata)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="m-director_name" label="Director name">
            <Input id="m-director_name" name="director_name" maxLength={120} />
          </Field>
          <Field id="m-director_contact" label="Director contact">
            <Input id="m-director_contact" name="director_contact" maxLength={120} />
          </Field>
          <Field id="m-director_email" label="Director email">
            <Input id="m-director_email" name="director_email" type="email" maxLength={120} />
          </Field>
          <Field id="m-headteacher_name" label="Headteacher name">
            <Input id="m-headteacher_name" name="headteacher_name" maxLength={120} />
          </Field>
          <Field id="m-headteacher_contact" label="Headteacher contact">
            <Input id="m-headteacher_contact" name="headteacher_contact" maxLength={120} />
          </Field>
          <Field id="m-headteacher_email" label="Headteacher email">
            <Input id="m-headteacher_email" name="headteacher_email" type="email" maxLength={120} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="m-school_location" label="School location">
              <Input id="m-school_location" name="school_location" maxLength={120} />
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
          <Input
            id="sp-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
          />
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
        <Input
          id="sp-slug"
          name="slug"
          maxLength={60}
          pattern="[a-z0-9][a-z0-9-]*"
          placeholder="my-classroom"
        />
      </Field>
      <Field id="sp-description" label="Description">
        <Textarea id="sp-description" name="description" maxLength={1000} />
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
          <Input
            id="ic-max_uses"
            name="max_uses"
            type="number"
            min={1}
            max={1000000}
            step={1}
            inputMode="numeric"
          />
        </Field>
        <Field id="ic-expires" label="Valid for (days)" hint="Blank = never expires">
          <Input
            id="ic-expires"
            name="expires_in_days"
            type="number"
            min={1}
            max={3650}
            step={1}
            inputMode="numeric"
          />
        </Field>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        Generate invitation code
      </Button>
    </form>
  );
}
