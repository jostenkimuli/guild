"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

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
import {
  ECOSYSTEM_TYPE_LABELS,
  SPACE_TYPE_LABELS,
  ecosystemTypeLabel,
  type SpaceType,
} from "@/lib/ecosystems";
import { navigateToEcosystemSubdomain } from "@/lib/subdomain-session";

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

function useRefreshOnSuccess(
  state: ConsoleActionState,
  onSuccess?: () => void,
) {
  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      onSuccess?.();
      router.refresh();
    }
  }, [state, router, onSuccess]);
}

function useNavigateOnSuccess(
  state: ConsoleActionState,
  path: string,
) {
  const router = useRouter();
  useEffect(() => {
    if (state.success && path) {
      if (/^https?:\/\//i.test(path)) {
        void navigateToEcosystemSubdomain(path);
      } else {
        router.push(path);
      }
    }
  }, [state, router, path]);
}

function CreateAdminAccountForm({
  idPrefix,
  action,
  actionLabel,
  hint,
  ecosystemId,
  showEcosystemType = false,
  onSuccess,
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
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {
    success: false,
  });
  useRefreshOnSuccess(state, onSuccess);

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

export function CreateProgramAdminForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  return (
    <CreateAdminAccountForm
      idPrefix="pa"
      action={createProgramAdmin}
      actionLabel="Create program admin"
      hint="The account starts pending and must be approved by the super admin before it can create ecosystem admins."
      onSuccess={onSuccess}
    />
  );
}

export function CreateEcosystemAdminForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  return (
    <CreateAdminAccountForm
      idPrefix="ea"
      action={createEcosystemAdmin}
      actionLabel="Create ecosystem admin"
      hint="The account starts pending. Approval is decided by the super admin, or by the program admin if the super admin has delegated approval to them."
      showEcosystemType
      onSuccess={onSuccess}
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
  const destination = state.code
    ? typeof window !== "undefined"
      ? `${window.location.protocol}//${state.code}.${window.location.host}`
      : `/ecosystem/${state.code}`
    : state.ecosystemId
      ? "/ecosystem"
      : "";
  useNavigateOnSuccess(state, destination);

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

const SCHOOL_STEP_LABELS = [
  "School Profile",
  "School Administration",
  "School Scope",
  "School Location",
];

const SCHOOL_GRADES = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Grade 13",
];

const SCHOOL_COUNTRIES = ["Uganda", "Kenya", "Tanzania", "Rwanda"];
const SCHOOL_REGIONS = ["Central", "Eastern", "Northern", "Western"];

function SchoolStepper({ current }: { current: number }) {
  return (
    <div>
      <div className="relative mt-4 hidden items-center justify-between md:flex">
        <div className="absolute -z-10 left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-variant" />
        {SCHOOL_STEP_LABELS.map((label, i) => {
          const step = i + 1;
          const active = step === current;
          return (
            <div
              key={label}
              className="relative z-10 flex flex-col items-center gap-1 bg-surface-container-lowest px-2 text-center"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ring-4 ring-surface-container-lowest ${
                  active
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                {step}
              </div>
              <span
                className={`text-sm ${
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground md:hidden">
        <span className="font-medium text-primary">
          Step {current} of {SCHOOL_STEP_LABELS.length}: {SCHOOL_STEP_LABELS[current - 1]}
        </span>
        <div className="flex gap-1">
          {SCHOOL_STEP_LABELS.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full ${
                i + 1 === current ? "bg-primary" : "bg-surface-variant"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 4-step school creation wizard (dash.html). Collects the school
 * profile, admin personnel, academic scope and location before
 * submitting to the createEcosystem server action at the end.
 */
export function CreateSchoolEcosystemForm({
  ecosystemType,
}: {
  ecosystemType?: string;
}) {
  const [state, action, pending] = useActionState(createEcosystem, {
    success: false,
  });
  const [step, setStep] = useState(1);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const destination = state.code
    ? typeof window !== "undefined"
      ? `${window.location.protocol}//${state.code}.${window.location.host}`
      : `/ecosystem/${state.code}`
    : state.ecosystemId
      ? "/ecosystem"
      : "";
  useNavigateOnSuccess(state, destination);

  const goNext = () => {
    setClientError(null);
    if (step === 1) {
      const name = new FormData(formRef.current ?? undefined).get("name");
      if (typeof name !== "string" || name.trim().length < 2) {
        setClientError("Please enter a school name to continue.");
        return;
      }
    }
    setStep((s) => Math.min(SCHOOL_STEP_LABELS.length, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (step < SCHOOL_STEP_LABELS.length) {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs md:p-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl md:max-h-[870px]">
        <div className="border-b bg-background px-4 pt-4 pb-3 md:px-6 md:py-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Create New School
              </h2>
              <p className="text-sm text-muted-foreground">
                {ecosystemTypeLabel(ecosystemType)} — establish your institution
                profile, staff, academic scope and location.
              </p>
            </div>
          </div>
          <SchoolStepper current={step} />
        </div>

        <form
          ref={formRef}
          action={action}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      {/* Step 1: School Profile */}
      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="school-name" label="School name" hint="Required. e.g. Kampala International Academy">
            <Input
              id="school-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="e.g. Kampala International Academy"
            />
          </Field>
          <Field id="school-type" label="Type">
            <p className="rounded-lg border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              {ecosystemTypeLabel(ecosystemType)}
            </p>
          </Field>
        </div>
        <Field
          id="school-vision"
          label="School vision"
          hint="Optional but recommended for your institutional profile."
        >
          <Textarea
            id="school-vision"
            name="vision"
            maxLength={1000}
            placeholder="Describe the overarching goal for the future…"
            rows={3}
          />
        </Field>
        <Field id="school-mission" label="School mission">
          <Textarea
            id="school-mission"
            name="mission"
            maxLength={1000}
            placeholder="Describe the practical steps to achieve the vision…"
            rows={3}
          />
        </Field>
      </div>

      {/* Step 2: School Administration */}
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="space-y-3 rounded-lg border bg-surface-container-lowest p-4">
          <p className="text-sm font-medium">Director&apos;s details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="m-director_name" label="Full name">
              <Input id="m-director_name" name="director_name" maxLength={120} placeholder="e.g. Jane Doe" />
            </Field>
            <Field id="m-director_contact" label="Phone number">
              <Input id="m-director_contact" name="director_contact" type="tel" maxLength={120} placeholder="+256…" />
            </Field>
            <Field id="m-director_email" label="Email address">
              <Input id="m-director_email" name="director_email" type="email" maxLength={120} placeholder="director@school.com" />
            </Field>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border bg-surface-container-lowest p-4">
          <p className="text-sm font-medium">Head teacher&apos;s details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="m-headteacher_name" label="Full name">
              <Input id="m-headteacher_name" name="headteacher_name" maxLength={120} placeholder="e.g. John Smith" />
            </Field>
            <Field id="m-headteacher_contact" label="Phone number">
              <Input id="m-headteacher_contact" name="headteacher_contact" type="tel" maxLength={120} placeholder="+256…" />
            </Field>
            <Field id="m-headteacher_email" label="Email address">
              <Input id="m-headteacher_email" name="headteacher_email" type="email" maxLength={120} placeholder="head@school.com" />
            </Field>
          </div>
        </div>
      </div>

      {/* Step 3: School Scope */}
      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <div className="space-y-3 rounded-lg border bg-surface-container-lowest p-4">
          <p className="text-sm font-medium">Select the grades your school offers</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {SCHOOL_GRADES.map((grade) => (
              <label
                key={grade}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-surface-container-high"
              >
                <input
                  type="checkbox"
                  name="grades"
                  value={grade}
                  className="size-4 rounded border-input text-primary accent-primary focus:ring-primary"
                />
                <span className="text-sm">{grade}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Step 4: School Location */}
      <div className={step === 4 ? "space-y-4" : "hidden"}>
        <div className="space-y-3 rounded-lg border bg-surface-container-lowest p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="m-country" label="Country">
              <select id="m-country" name="country" className={selectClass} defaultValue="" required>
                <option value="" disabled>
                  Select country
                </option>
                {SCHOOL_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="m-region" label="Region">
              <select id="m-region" name="region" className={selectClass} defaultValue="" required>
                <option value="" disabled>
                  Select region
                </option>
                {SCHOOL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="m-district" label="District/State">
              <Input id="m-district" name="district" maxLength={120} placeholder="e.g. Kampala" required />
            </Field>
            <Field id="m-sub_county" label="Sub county">
              <Input id="m-sub_county" name="sub_county" maxLength={120} placeholder="e.g. Makindye" required />
            </Field>
            <Field id="m-parish" label="Parish/Village">
              <Input id="m-parish" name="parish" maxLength={120} placeholder="e.g. Kansanga" required />
            </Field>
            <input type="hidden" name="school_location" />
          </div>
        </div>
      </div>

      <Feedback state={state} />
            {clientError ? (
              <p className="text-sm text-destructive">{clientError}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t bg-background px-4 py-3 md:px-6 md:py-4">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1 || pending}>
              Back
            </Button>
            {step < SCHOOL_STEP_LABELS.length ? (
              <Button type="button" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? "Creating school…" : "Finish"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
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

export type InvitationSpace = {
  id: string;
  name: string;
  grades: { id: string; name: string }[];
};

export function CreateInvitationCodeForm({
  spaces,
  mode,
  defaultSpaceId,
  onSuccess,
}: {
  spaces: InvitationSpace[];
  mode: "learner" | "teacher";
  defaultSpaceId?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createInvitationCode, {
    success: false,
  });
  const router = useRouter();

  const [selectedSpaceId, setSelectedSpaceId] = useState(
    defaultSpaceId ?? spaces[0]?.id ?? "",
  );

  useEffect(() => {
    if (state.success && state.code) {
      toast.success(`Invitation code created`, {
        description: `Code: ${state.code}`,
      });
      onSuccess?.();
      router.refresh();
    }
  }, [state, router, onSuccess]);

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
  const grades = mode === "learner" ? (selectedSpace?.grades ?? []) : [];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={mode === "learner" ? "learner" : "teacher"} />

      {spaces.length > 1 && !defaultSpaceId ? (
        <Field id="inv-space" label="Space">
          <select
            id="inv-space"
            name="space_id"
            className={selectClass}
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
          >
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="space_id" value={selectedSpaceId} />
      )}

      {mode === "learner" && grades.length > 0 ? (
        <Field id="inv-grade" label="Grade" hint="Learners will be enrolled in this grade upon signup.">
          <select id="inv-grade" name="grade_id" className={selectClass} defaultValue="">
            <option value="">— No specific grade —</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="inv-max-uses" label="Max uses" hint="Leave blank for unlimited.">
          <Input
            id="inv-max-uses"
            name="max_uses"
            type="number"
            min={1}
            placeholder="Unlimited"
          />
        </Field>
        <Field id="inv-expires" label="Expires in days" hint="Leave blank for no expiry.">
          <Input
            id="inv-expires"
            name="expires_in_days"
            type="number"
            min={1}
            placeholder="Never"
          />
        </Field>
      </div>

      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate code"}
      </Button>
    </form>
  );
}
