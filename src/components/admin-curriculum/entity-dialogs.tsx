"use client";

import { useEffect, useRef, useState, useActionState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  saveAim,
  saveAreaUnit,
  saveAssessmentGuideline,
  saveNode,
  savePeriodAllocation,
  saveRule,
  saveStrand,
  type AdminActionState,
} from "@/app/actions/national-curriculum-admin";
import { selectClass } from "@/components/curriculum/form-styles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REQUIREMENT_LABELS, REQUIREMENT_LEVELS } from "@/lib/curriculum/requirement";
import type {
  NationalAim,
  NationalAllocation,
  NationalAreaUnit,
  NationalGuideline,
  NationalRule,
  NationalStrand,
} from "@/lib/curriculum/national";

const RULE_GROUPS = [
  { value: "language", label: "Language" },
  { value: "timetable", label: "Timetable" },
  { value: "assessment", label: "Assessment" },
  { value: "teaching", label: "Teaching" },
] as const;

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** Shared shell: a trigger button, a dialog, a form bound to `action` that closes itself on success. */
function EntityDialog({
  trigger,
  title,
  description,
  action,
  hidden,
  children,
  submitLabel = "Save",
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  hidden?: Record<string, string>;
  children: ReactNode;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, { success: false });
  const handled = useRef(false);

  useEffect(() => {
    if (state.success && !handled.current) {
      handled.current = true;
      setOpen(false);
      router.refresh();
    }
    if (open) handled.current = false;
  }, [state, open, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {Object.entries(hidden ?? {}).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {children}
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Strand
// ------------------------------------------------------------

export function StrandDialog({
  curriculumId,
  strand,
  trigger,
}: {
  curriculumId: string;
  strand?: NationalStrand;
  trigger: ReactNode;
}) {
  return (
    <EntityDialog
      trigger={trigger}
      title={strand ? "Edit learning area" : "Add learning area"}
      description="A strand or subject the curriculum organises content under, e.g. Mathematics."
      action={saveStrand}
      hidden={{ national_curriculum_id: curriculumId, ...(strand ? { id: strand.id } : {}) }}
    >
      <Field id="key" label="Key (short, unique, e.g. mathematics)">
        <Input id="key" name="key" defaultValue={strand?.key} required maxLength={40} />
      </Field>
      <Field id="name" label="Name">
        <Input id="name" name="name" defaultValue={strand?.name} required maxLength={200} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_thematic"
          defaultChecked={strand?.is_thematic ?? true}
          className="size-4 accent-primary"
        />
        Runs through every theme (uncheck for a subject with its own schedule, e.g. RE, PE)
      </label>
      <Field id="sort_order" label="Sort order">
        <Input id="sort_order" name="sort_order" type="number" defaultValue={strand?.sort_order ?? 0} />
      </Field>
    </EntityDialog>
  );
}

// ------------------------------------------------------------
// Aim
// ------------------------------------------------------------

export function AimDialog({
  curriculumId,
  aim,
  defaultKind,
  trigger,
}: {
  curriculumId: string;
  aim?: NationalAim;
  defaultKind?: "national" | "primary";
  trigger: ReactNode;
}) {
  return (
    <EntityDialog
      trigger={trigger}
      title={aim ? "Edit aim" : "Add aim"}
      action={saveAim}
      hidden={{ national_curriculum_id: curriculumId, ...(aim ? { id: aim.id } : {}) }}
    >
      <Field id="kind" label="Kind">
        <select id="kind" name="kind" className={selectClass} defaultValue={aim?.kind ?? defaultKind ?? "national"}>
          <option value="national">National aim of education</option>
          <option value="primary">Aim of this level</option>
        </select>
      </Field>
      <Field id="position" label="Position (display order)">
        <Input id="position" name="position" type="number" min={1} defaultValue={aim?.position ?? 1} required />
      </Field>
      <Field id="description" label="Description">
        <Textarea id="description" name="description" rows={3} defaultValue={aim?.description} required />
      </Field>
    </EntityDialog>
  );
}

// ------------------------------------------------------------
// Period allocation
// ------------------------------------------------------------

export function AllocationDialog({
  curriculumId,
  allocation,
  trigger,
}: {
  curriculumId: string;
  allocation?: NationalAllocation;
  trigger: ReactNode;
}) {
  return (
    <EntityDialog
      trigger={trigger}
      title={allocation ? "Edit weekly period" : "Add weekly period"}
      description="One row of the weekly timetable, e.g. Mathematics, 5 periods."
      action={savePeriodAllocation}
      hidden={{ national_curriculum_id: curriculumId, ...(allocation ? { id: allocation.id } : {}) }}
    >
      <Field id="key" label="Key (short, unique)">
        <Input id="key" name="key" defaultValue={allocation?.key} required maxLength={40} />
      </Field>
      <Field id="label" label="Label">
        <Input id="label" name="label" defaultValue={allocation?.label} required maxLength={200} />
      </Field>
      <Field id="group_label" label="Group label (optional, e.g. Creative Performing Arts)">
        <Input id="group_label" name="group_label" defaultValue={allocation?.group_label ?? ""} maxLength={100} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="periods" label="Periods a week">
          <Input id="periods" name="periods" type="number" min={0} defaultValue={allocation?.periods ?? 1} required />
        </Field>
        <Field id="block_size" label="Block size (1 = single lesson)">
          <Input id="block_size" name="block_size" type="number" min={1} defaultValue={allocation?.block_size ?? 1} required />
        </Field>
      </div>
      <Field id="follows_key" label="Follows key (optional — must directly follow this other key)">
        <Input id="follows_key" name="follows_key" defaultValue={allocation?.follows_key ?? ""} maxLength={40} />
      </Field>
      <Field id="note" label="Note (optional)">
        <Textarea id="note" name="note" rows={2} defaultValue={allocation?.note ?? ""} />
      </Field>
      <Field id="sort_order" label="Sort order">
        <Input id="sort_order" name="sort_order" type="number" defaultValue={allocation?.sort_order ?? 0} />
      </Field>
    </EntityDialog>
  );
}

// ------------------------------------------------------------
// Rule
// ------------------------------------------------------------

export function RuleDialog({
  curriculumId,
  rule,
  trigger,
}: {
  curriculumId: string;
  rule?: NationalRule;
  trigger: ReactNode;
}) {
  return (
    <EntityDialog
      trigger={trigger}
      title={rule ? "Edit rule" : "Add rule"}
      action={saveRule}
      hidden={{ national_curriculum_id: curriculumId, ...(rule ? { id: rule.id } : {}) }}
    >
      <Field id="rule_group" label="Group">
        <select id="rule_group" name="rule_group" className={selectClass} defaultValue={rule?.rule_group ?? "timetable"}>
          {RULE_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="requirement_level" label="Requirement level">
        <select
          id="requirement_level"
          name="requirement_level"
          className={selectClass}
          defaultValue={rule?.requirement_level ?? "mandatory"}
        >
          {REQUIREMENT_LEVELS.map((level) => (
            <option key={level} value={level}>
              {REQUIREMENT_LABELS[level]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="description" label="Description">
        <Textarea id="description" name="description" rows={3} defaultValue={rule?.description} required />
      </Field>
      <Field id="sort_order" label="Sort order">
        <Input id="sort_order" name="sort_order" type="number" defaultValue={rule?.sort_order ?? 0} />
      </Field>
    </EntityDialog>
  );
}

// ------------------------------------------------------------
// Area unit (RE / PE style subjects with their own schedule)
// ------------------------------------------------------------

export function AreaUnitDialog({
  curriculumId,
  strands,
  unit,
  defaultStrandId,
  trigger,
}: {
  curriculumId: string;
  strands: NationalStrand[];
  unit?: NationalAreaUnit;
  defaultStrandId?: string;
  trigger: ReactNode;
}) {
  return (
    <EntityDialog
      trigger={trigger}
      title={unit ? "Edit unit" : "Add unit"}
      action={saveAreaUnit}
      hidden={{ national_curriculum_id: curriculumId, ...(unit ? { id: unit.id } : {}) }}
    >
      <Field id="strand_id" label="Learning area">
        <select
          id="strand_id"
          name="strand_id"
          className={selectClass}
          defaultValue={unit?.strand_id ?? defaultStrandId ?? strands[0]?.id}
          required
        >
          {strands.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field id="term_no" label="Term">
        <select id="term_no" name="term_no" className={selectClass} defaultValue={unit?.term_no ?? 1}>
          <option value={1}>Term 1</option>
          <option value={2}>Term 2</option>
          <option value={3}>Term 3</option>
        </select>
      </Field>
      <Field id="weeks_label" label="Weeks label (e.g. Weeks 2-4)">
        <Input id="weeks_label" name="weeks_label" defaultValue={unit?.weeks_label} required maxLength={40} />
      </Field>
      <Field id="title" label="Title">
        <Input id="title" name="title" defaultValue={unit?.title} required maxLength={300} />
      </Field>
      <Field id="learning_outcome" label="Learning outcome (optional)">
        <Textarea id="learning_outcome" name="learning_outcome" rows={2} defaultValue={unit?.learning_outcome ?? ""} />
      </Field>
      <Field id="sort_order" label="Sort order">
        <Input id="sort_order" name="sort_order" type="number" defaultValue={unit?.sort_order ?? 0} />
      </Field>
    </EntityDialog>
  );
}

// ------------------------------------------------------------
// Assessment guideline
// ------------------------------------------------------------

export function GuidelineDialog({
  curriculumId,
  themeNodeId,
  strands,
  guideline,
  trigger,
}: {
  curriculumId: string;
  themeNodeId: string;
  strands: NationalStrand[];
  guideline?: NationalGuideline;
  trigger: ReactNode;
}) {
  return (
    <EntityDialog
      trigger={trigger}
      title={guideline ? "Edit assessment guideline" : "Add assessment guideline"}
      description="A competence that can be assessed by the end of this theme."
      action={saveAssessmentGuideline}
      hidden={{
        national_curriculum_id: curriculumId,
        theme_node_id: themeNodeId,
        ...(guideline ? { id: guideline.id } : {}),
      }}
    >
      <Field id="strand_id" label="Learning area">
        <select
          id="strand_id"
          name="strand_id"
          className={selectClass}
          defaultValue={guideline?.strand_id ?? strands[0]?.id}
          required
        >
          {strands.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field id="description" label="Description">
        <Textarea id="description" name="description" rows={2} defaultValue={guideline?.description} required />
      </Field>
      <Field id="sort_order" label="Sort order">
        <Input id="sort_order" name="sort_order" type="number" defaultValue={guideline?.sort_order ?? 0} />
      </Field>
    </EntityDialog>
  );
}

// ------------------------------------------------------------
// Curriculum tree node: theme / sub_theme / competence
// ------------------------------------------------------------

type NodeDefaults = {
  id?: string;
  title?: string;
  description?: string;
  sequenceOrder?: number;
  themeNo?: number;
  termNo?: number;
  code?: string;
  position?: number;
  strandId?: string;
  requirementLevel?: string;
};

export function NodeDialog({
  curriculumId,
  nodeType,
  parentId,
  strands,
  defaults,
  trigger,
}: {
  curriculumId: string;
  nodeType: "theme" | "sub_theme" | "competence";
  parentId?: string;
  strands: NationalStrand[];
  defaults?: NodeDefaults;
  trigger: ReactNode;
}) {
  const labels = { theme: "theme", sub_theme: "sub-theme", competence: "competence" } as const;
  return (
    <EntityDialog
      trigger={trigger}
      title={defaults?.id ? `Edit ${labels[nodeType]}` : `Add ${labels[nodeType]}`}
      action={saveNode}
      hidden={{
        national_curriculum_id: curriculumId,
        node_type: nodeType,
        parent_id: parentId ?? "",
        ...(defaults?.id ? { id: defaults.id } : {}),
      }}
    >
      <Field id="title" label={nodeType === "competence" ? "Competence" : "Name"}>
        {nodeType === "competence" ? (
          <Textarea id="title" name="title" rows={2} defaultValue={defaults?.title} required maxLength={500} />
        ) : (
          <Input id="title" name="title" defaultValue={defaults?.title} required maxLength={500} />
        )}
      </Field>

      {nodeType === "theme" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field id="theme_no" label="Theme number">
            <Input id="theme_no" name="theme_no" type="number" min={1} defaultValue={defaults?.themeNo ?? 1} required />
          </Field>
          <Field id="term_no" label="Term">
            <select id="term_no" name="term_no" className={selectClass} defaultValue={defaults?.termNo ?? 1}>
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
            </select>
          </Field>
        </div>
      ) : null}

      {nodeType === "sub_theme" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field id="code" label="Code (e.g. 1.1)">
            <Input id="code" name="code" defaultValue={defaults?.code} required maxLength={20} />
          </Field>
          <Field id="position" label="Week position in theme">
            <Input id="position" name="position" type="number" min={1} defaultValue={defaults?.position ?? 1} required />
          </Field>
        </div>
      ) : null}

      {nodeType === "competence" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field id="strand_id" label="Learning area">
            <select
              id="strand_id"
              name="strand_id"
              className={selectClass}
              defaultValue={defaults?.strandId ?? strands[0]?.id}
              required
            >
              {strands.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="requirement_level" label="Requirement level">
            <select
              id="requirement_level"
              name="requirement_level"
              className={selectClass}
              defaultValue={defaults?.requirementLevel ?? "required_outcome"}
            >
              {REQUIREMENT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {REQUIREMENT_LABELS[level]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {nodeType !== "competence" ? (
        <Field id="description" label={nodeType === "theme" ? "Expected learning outcome" : "Content summary"}>
          <Textarea id="description" name="description" rows={3} defaultValue={defaults?.description ?? ""} />
        </Field>
      ) : null}

      <Field id="sequence_order" label="Sort order">
        <Input id="sequence_order" name="sequence_order" type="number" defaultValue={defaults?.sequenceOrder ?? 0} />
      </Field>
    </EntityDialog>
  );
}
