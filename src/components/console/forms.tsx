"use client";

import { useEffect, useActionState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  createEcosystem,
  createEcosystemAdmin,
  createProgramAdmin,
  createSpace,
  createSpaceAdmin,
} from "@/app/actions/console";
import type { ConsoleActionState } from "@/app/actions/console";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ECOSYSTEM_TYPE_LABELS,
  SPACE_TYPE_LABELS,
  ecosystemTypeLabel,
  type SpaceType,
} from "@/lib/ecosystems";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

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

export { Field };

function Feedback({ state }: { state: ConsoleActionState }) {
  if (state.success) {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">Done.</p>
    );
  }
  if (state.error) {
    return <p className="text-sm text-destructive">{state.error}</p>;
  }
  return null;
}

export { Feedback };

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
  showEcosystemType = false,
}: {
  idPrefix: string;
  action: (
    _: ConsoleActionState,
    formData: FormData,
  ) => Promise<ConsoleActionState>;
  actionLabel: string;
  hint: string;
  ecosystemId?: string;
  showEcosystemType?: boolean;
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
      {showEcosystemType ? (
        <Field
          id={`${idPrefix}-ecosystem_type`}
          label="Ecosystem type"
          hint="The type of ecosystem this admin will create."
        >
          <select
            id={`${idPrefix}-ecosystem_type`}
            name="ecosystem_type"
            className={selectClass}
            defaultValue="primary_school"
          >
            {Object.entries(ECOSYSTEM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
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
      showEcosystemType
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

export function CreateEcosystemForm({ ecosystemType }: { ecosystemType?: string }) {
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
          <p className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {ecosystemTypeLabel(ecosystemType)}
          </p>
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

export function CreateSpaceForm({
  ecosystemId,
  defaultType = "department",
}: {
  ecosystemId: string;
  defaultType?: SpaceType;
}) {
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
          <select
            id="sp-type"
            name="type"
            className={selectClass}
            defaultValue={defaultType}
          >
            {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="sp-slug" label="Slug" hint="Optional; generated from the name if left blank.">
        <Input
          id="sp-slug"
          name="slug"
          maxLength={60}
          pattern="[a-z0-9][a-z0-9-]*"
          placeholder="my-department"
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
