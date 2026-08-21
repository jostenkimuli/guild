"use client";

import { startTransition, useEffect, useActionState, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { saveCurriculumData } from "@/app/actions/curriculum";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  LayoutGridIcon,
  ListOrderedIcon,
  ListTreeIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TopicForm = {
  name: string;
  description: string;
  duration_weeks: string;
};

type UnitForm = {
  name: string;
  topics: TopicForm[];
};

type TermForm = {
  name: string;
  units: UnitForm[];
};

type WizardForm = {
  curriculumMode: "existing" | "new";
  curriculumId: string;
  newName: string;
  newYear: string;
  goals: string[];
  targetGrades: string[];
  terms: TermForm[];
};

const STEPS = [
  { id: 1, title: "Curricula Details", icon: InfoIcon },
  { id: 2, title: "Curriculum Goals", icon: CheckIcon },
  { id: 3, title: "Target Grades", icon: ListOrderedIcon },
  { id: 4, title: "Academic Terms", icon: CalendarDaysIcon },
  { id: 5, title: "Units", icon: LayoutGridIcon },
  { id: 6, title: "Topics", icon: ListTreeIcon },
] as const;

const TARGET_GRADES = [
  "Pre-Kindergarten",
  "Kindergarten",
  "Grade 01",
  "Grade 02",
  "Grade 03",
  "Grade 04",
  "Grade 05",
  "Grade 06",
  "Grade 07",
  "Grade 08",
  "Grade 09",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Grade 13",
  "Technical and Vocational Educational Training",
] as const;

const emptyTopic = (): TopicForm => ({
  name: "",
  description: "",
  duration_weeks: "",
});
const emptyUnit = (): UnitForm => ({ name: "", topics: [emptyTopic()] });
const emptyTerm = (): TermForm => ({ name: "", units: [emptyUnit()] });

const inputClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function ListEditor({
  label,
  addLabel,
  children,
  onAdd,
}: {
  label: string;
  addLabel: string;
  children: ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-7 gap-1"
        >
          <PlusIcon className="size-3.5" />
          {addLabel}
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RowShell({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">{children}</div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <TrashIcon className="size-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  );
}

function WizardFooter({
  currentStep,
  totalSteps,
  pending,
  onBack,
  onNext,
  onPublish,
}: {
  currentStep: number;
  totalSteps: number;
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: (publish: boolean) => void;
}) {
  const isLast = currentStep === totalSteps;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border p-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onBack}
        disabled={currentStep === 1 || pending}
        className={cn(currentStep === 1 && "invisible")}
      >
        <ChevronLeftIcon className="size-4" />
        Back
      </Button>

      {isLast ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Finish blueprint"}
              <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPublish(false)}>
              Save as draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPublish(true)}>
              Publish blueprint
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button type="button" size="sm" onClick={onNext}>
          Next Step
          <ChevronRightIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function CurriculumDialog({
  space,
  curricula,
}: {
  space: { id: string };
  curricula: { id: string; name: string; year: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Manage curriculum data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle>Blueprint Wizard</DialogTitle>
          <DialogDescription>
            Build or edit the curriculum blueprint for this space.
          </DialogDescription>
        </DialogHeader>
        <Wizard
          space={space}
          curricula={curricula}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Wizard({
  space,
  curricula,
  onSuccess,
}: {
  space: { id: string };
  curricula: { id: string; name: string; year: number }[];
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>({
    curriculumMode: curricula.length > 0 ? "existing" : "new",
    curriculumId: curricula[0]?.id ?? "",
    newName: "",
    newYear: String(new Date().getFullYear()),
    goals: [""],
    targetGrades: [],
    terms: [emptyTerm()],
  });

  const [state, formAction, pending] = useActionState(saveCurriculumData, {
    success: false,
  });

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  function publish(publishFlag: boolean) {
    if (pending) return;
    const payload = {
      space_id: space.id,
      curriculum_id:
        form.curriculumMode === "existing" ? form.curriculumId : null,
      new_curriculum_name:
        form.curriculumMode === "new" ? form.newName : undefined,
      new_curriculum_year:
        form.curriculumMode === "new"
          ? form.newYear
            ? Number(form.newYear)
            : undefined
          : undefined,
      goals: form.goals.filter((goal) => goal.trim().length > 0),
      target_grades: form.targetGrades,
      terms: form.terms
        .filter((term) => term.name.trim().length > 0)
        .map((term) => ({
          name: term.name,
          units: term.units
            .filter((unit) => unit.name.trim().length > 0)
            .map((unit) => ({
              name: unit.name,
              topics: unit.topics
                .filter((topic) => topic.name.trim().length > 0)
                .map((topic) => ({
                  name: topic.name,
                  description: topic.description || undefined,
                  duration_weeks: topic.duration_weeks
                    ? Number(topic.duration_weeks)
                    : undefined,
                })),
            })),
        })),
      publish: publishFlag,
    };

    if (form.curriculumMode === "new") {
      if (!payload.new_curriculum_name?.trim()) {
        setForm((f) => ({ ...f, newName: " " }));
        setStep(1);
        return;
      }
      if (payload.new_curriculum_year) {
        const year = payload.new_curriculum_year;
        if (!Number.isInteger(year) || year < 1900 || year > 2100) {
          setStep(1);
          return;
        }
      }
    }
    if (form.targetGrades.length === 0) {
      setStep(3);
      return;
    }

    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));
    startTransition(() => {
      formAction(formData);
    });
  }

  function updateGateway() {
    if (step >= 6) return;
    if (step === 1 && form.curriculumMode === "new" && !form.newName.trim()) {
      return;
    }
    if (step === 3 && form.targetGrades.length === 0) {
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div className="grid h-[70vh] grid-rows-[auto_1fr_auto] sm:grid-cols-[200px_1fr] sm:grid-rows-1">
      {/* Sidebar stepper */}
      <aside className="flex flex-row gap-2 overflow-x-auto border-b border-border p-4 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
        <p className="mb-2 hidden text-xs font-medium uppercase tracking-wide text-muted-foreground sm:block">
          Program Setup
        </p>
        <p className="mb-3 hidden text-sm text-muted-foreground sm:block">
          Step {step} of {STEPS.length}
        </p>
        <nav className="flex flex-row gap-3 sm:flex-col sm:gap-0">
          {STEPS.map((stepDef) => {
            const isActive = stepDef.id === step;
            const isCompleted = stepDef.id < step;
            const Icon = stepDef.icon;
            return (
              <button
                key={stepDef.id}
                type="button"
                onClick={() => setStep(stepDef.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <Icon className="size-3" />
                  )}
                </span>
                <span className={cn("hidden whitespace-nowrap md:inline")}>
                  {stepDef.title}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content + footer */}
      <div className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[640px]">
            {/* Step 1: Curricula Details */}
            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <h3 className="font-heading text-lg font-medium">
                    Curricula Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the curriculum this blueprint builds, or create one
                    for this space.
                  </p>
                </div>
                <fieldset className="space-y-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="curriculum-mode-existing"
                      className="flex items-center gap-2 font-normal"
                    >
                      <input
                        type="radio"
                        name="curriculum_mode"
                        id="curriculum-mode-existing"
                        value="existing"
                        checked={form.curriculumMode === "existing"}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            curriculumMode: "existing",
                          }))
                        }
                        disabled={curricula.length === 0}
                      />
                      Edit an Existing curriculum
                    </Label>
                    <Label
                      htmlFor="curriculum-mode-new"
                      className="flex items-center gap-2 font-normal"
                    >
                      <input
                        type="radio"
                        name="curriculum_mode"
                        id="curriculum-mode-new"
                        value="new"
                        checked={form.curriculumMode === "new"}
                        onChange={() =>
                          setForm((f) => ({ ...f, curriculumMode: "new" }))
                        }
                      />
                      Create a new curriculum
                    </Label>
                  </div>
                  {form.curriculumMode === "existing" ? (
                    <select
                      value={form.curriculumId}
                      onChange={(event) =>
                        setForm((f) => ({
                          ...f,
                          curriculumId: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      {curricula.map((curriculum) => (
                        <option key={curriculum.id} value={curriculum.id}>
                          {curriculum.name} · {curriculum.year}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-curriculum-name">Name</Label>
                        <Input
                          id="new-curriculum-name"
                          value={form.newName}
                          onChange={(event) =>
                            setForm((f) => ({
                              ...f,
                              newName: event.target.value,
                            }))
                          }
                          placeholder="Primary Mathematics"
                          maxLength={120}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-curriculum-year">Year</Label>
                        <Input
                          id="new-curriculum-year"
                          type="number"
                          value={form.newYear}
                          onChange={(event) =>
                            setForm((f) => ({
                              ...f,
                              newYear: event.target.value,
                            }))
                          }
                          min={1900}
                          max={2100}
                        />
                      </div>
                    </div>
                  )}
                  {form.curriculumMode === "new" && !form.newName.trim() ? (
                    <p className="text-xs text-muted-foreground">
                      You must name the curriculum before continuing.
                    </p>
                  ) : null}
                </fieldset>
              </div>
            ) : null}

            {/* Step 2: Curriculum Goals */}
            {step === 2 ? (
              <ListEditor
                label="Curriculum Goals"
                addLabel="Add goal"
                onAdd={() => setForm((f) => ({ ...f, goals: [...f.goals, ""] }))}
              >
                {form.goals.map((goal, index) => (
                  <RowShell
                    key={index}
                    onRemove={() =>
                      setForm((f) => ({
                        ...f,
                        goals: f.goals.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Textarea
                      value={goal}
                      onChange={(event) => {
                        const next = [...form.goals];
                        next[index] = event.target.value;
                        setForm((f) => ({ ...f, goals: next }));
                      }}
                      placeholder="A goal this curriculum should achieve"
                      maxLength={1000}
                    />
                  </RowShell>
                ))}
              </ListEditor>
            ) : null}

            {/* Step 3: Target Grades */}
            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <h3 className="font-heading text-lg font-medium">
                    Target Grades
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select all grade levels this blueprint applies to. The
                    curriculum tree is replicated under every selected grade.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TARGET_GRADES.map((grade) => {
                    const selected = form.targetGrades.includes(grade);
                    return (
                      <Label
                        key={grade}
                        className="cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={selected}
                          onChange={() => {
                            const next = selected
                              ? form.targetGrades.filter((g) => g !== grade)
                              : [...form.targetGrades, grade];
                            setForm((f) => ({ ...f, targetGrades: next }));
                          }}
                        />
                        <div
                          className={cn(
                            "rounded-lg border p-3 transition-colors",
                            selected
                              ? "border-primary bg-accent/50"
                              : "hover:bg-accent/30",
                          )}
                        >
                          <span className="text-sm font-medium">
                            {grade}
                          </span>
                        </div>
                      </Label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Step 4: Academic Terms */}
            {step === 4 ? (
              <ListEditor
                label="Academic Terms"
                addLabel="Add term"
                onAdd={() =>
                  setForm((f) => ({ ...f, terms: [...f.terms, emptyTerm()] }))
                }
              >
                {form.terms.map((term, termIndex) => (
                  <RowShell
                    key={termIndex}
                    onRemove={() =>
                      setForm((f) => ({
                        ...f,
                        terms: f.terms.filter((_, i) => i !== termIndex),
                      }))
                    }
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`term-${termIndex}`}>Term</Label>
                      <Input
                        id={`term-${termIndex}`}
                        value={term.name}
                        onChange={(event) => {
                          const next = [...form.terms];
                          next[termIndex] = { ...term, name: event.target.value };
                          setForm((f) => ({ ...f, terms: next }));
                        }}
                        placeholder="Term 1"
                        maxLength={120}
                      />
                    </div>
                  </RowShell>
                ))}
              </ListEditor>
            ) : null}

            {/* Step 5: Units */}
            {step === 5 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-lg font-medium">
                    Units Breakdown
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add the units that live under each academic term.
                  </p>
                </div>
                {form.terms.filter((term) => term.name.trim()).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add at least one academic term on the previous step first.
                  </p>
                ) : null}
                {form.terms
                  .map((term, termIndex) => ({ term, termIndex }))
                  .filter(({ term }) => term.name.trim())
                  .map(({ term, termIndex }) => (
                    <div key={termIndex} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{term.name}</h4>
                        <Badge variant="secondary">Term</Badge>
                      </div>
                      <ListEditor
                        label="Units"
                        addLabel="Add unit"
                        onAdd={() => {
                          const next = [...form.terms];
                          next[termIndex] = {
                            ...term,
                            units: [...term.units, emptyUnit()],
                          };
                          setForm((f) => ({ ...f, terms: next }));
                        }}
                      >
                        {term.units.map((unit, unitIndex) => (
                          <RowShell
                            key={unitIndex}
                            onRemove={() => {
                              const next = [...form.terms];
                              next[termIndex] = {
                                ...term,
                                units: term.units.filter(
                                  (_, i) => i !== unitIndex,
                                ),
                              };
                              setForm((f) => ({ ...f, terms: next }));
                            }}
                          >
                            <div className="space-y-1.5">
                              <Label htmlFor={`unit-${termIndex}-${unitIndex}`}>
                                Unit
                              </Label>
                              <Input
                                id={`unit-${termIndex}-${unitIndex}`}
                                value={unit.name}
                                onChange={(event) => {
                                  const next = [...form.terms];
                                  const units = [...term.units];
                                  units[unitIndex] = {
                                    ...unit,
                                    name: event.target.value,
                                  };
                                  next[termIndex] = { ...term, units };
                                  setForm((f) => ({ ...f, terms: next }));
                                }}
                                placeholder="Number and Algebra"
                                maxLength={120}
                              />
                            </div>
                          </RowShell>
                        ))}
                      </ListEditor>
                    </div>
                  ))}
              </div>
            ) : null}

            {/* Step 6: Topics */}
            {step === 6 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading text-lg font-medium">
                    Topics & Allocations
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add topics under each unit, with an optional weekly
                    allocation.
                  </p>
                </div>
                {form.terms
                  .map((term, termIndex) => ({ term, termIndex }))
                  .filter(({ term }) => term.name.trim())
                  .flatMap(({ term, termIndex }) =>
                    term.units
                      .map((unit, unitIndex) => ({ unit, termIndex, unitIndex }))
                      .filter(({ unit }) => unit.name.trim()),
                  ).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add at least one unit on the previous step first.
                  </p>
                ) : null}
                {form.terms
                  .map((term, termIndex) => ({ term, termIndex }))
                  .filter(({ term }) => term.name.trim())
                  .flatMap(({ term, termIndex }) =>
                    term.units
                      .map((unit, unitIndex) => ({ unit, termIndex, unitIndex }))
                      .filter(({ unit }) => unit.name.trim()),
                  )
                  .map(({ unit, termIndex, unitIndex }) => (
                    <div key={`${termIndex}-${unitIndex}`} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{unit.name}</h4>
                        <Badge variant="secondary">Unit</Badge>
                      </div>
                      <ListEditor
                        label="Topics"
                        addLabel="Add topic"
                        onAdd={() => {
                          const next = [...form.terms];
                          const nextUnits = [...next[termIndex].units];
                          nextUnits[unitIndex] = {
                            ...unit,
                            topics: [...unit.topics, emptyTopic()],
                          };
                          next[termIndex] = {
                            ...next[termIndex],
                            units: nextUnits,
                          };
                          setForm((f) => ({ ...f, terms: next }));
                        }}
                      >
                        {unit.topics.map((topic, topicIndex) => (
                          <RowShell
                            key={topicIndex}
                            onRemove={() => {
                              const next = [...form.terms];
                              const nextUnits = [...next[termIndex].units];
                              nextUnits[unitIndex] = {
                                ...unit,
                                topics: unit.topics.filter(
                                  (_, i) => i !== topicIndex,
                                ),
                              };
                              next[termIndex] = {
                                ...next[termIndex],
                                units: nextUnits,
                              };
                              setForm((f) => ({ ...f, terms: next }));
                            }}
                          >
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`topic-${termIndex}-${unitIndex}-${topicIndex}`}
                                >
                                  Topic
                                </Label>
                                <Input
                                  id={`topic-${termIndex}-${unitIndex}-${topicIndex}`}
                                  value={topic.name}
                                  onChange={(event) => {
                                    const next = [...form.terms];
                                    const nextUnits = [...next[termIndex].units];
                                    const nextTopics = [...unit.topics];
                                    nextTopics[topicIndex] = {
                                      ...topic,
                                      name: event.target.value,
                                    };
                                    nextUnits[unitIndex] = {
                                      ...unit,
                                      topics: nextTopics,
                                    };
                                    next[termIndex] = {
                                      ...next[termIndex],
                                      units: nextUnits,
                                    };
                                    setForm((f) => ({ ...f, terms: next }));
                                  }}
                                  placeholder="Linear Equations"
                                  maxLength={120}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`topic-desc-${termIndex}-${unitIndex}-${topicIndex}`}
                                >
                                  Description
                                </Label>
                                <Textarea
                                  id={`topic-desc-${termIndex}-${unitIndex}-${topicIndex}`}
                                  value={topic.description}
                                  onChange={(event) => {
                                    const next = [...form.terms];
                                    const nextUnits = [...next[termIndex].units];
                                    const nextTopics = [...unit.topics];
                                    nextTopics[topicIndex] = {
                                      ...topic,
                                      description: event.target.value,
                                    };
                                    nextUnits[unitIndex] = {
                                      ...unit,
                                      topics: nextTopics,
                                    };
                                    next[termIndex] = {
                                      ...next[termIndex],
                                      units: nextUnits,
                                    };
                                    setForm((f) => ({ ...f, terms: next }));
                                  }}
                                  placeholder="Optional description of what this topic covers"
                                  maxLength={1000}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`topic-duration-${termIndex}-${unitIndex}-${topicIndex}`}
                                >
                                  Duration (weeks)
                                </Label>
                                <Input
                                  id={`topic-duration-${termIndex}-${unitIndex}-${topicIndex}`}
                                  type="number"
                                  value={topic.duration_weeks}
                                  onChange={(event) => {
                                    const next = [...form.terms];
                                    const nextUnits = [...next[termIndex].units];
                                    const nextTopics = [...unit.topics];
                                    nextTopics[topicIndex] = {
                                      ...topic,
                                      duration_weeks: event.target.value,
                                    };
                                    nextUnits[unitIndex] = {
                                      ...unit,
                                      topics: nextTopics,
                                    };
                                    next[termIndex] = {
                                      ...next[termIndex],
                                      units: nextUnits,
                                    };
                                    setForm((f) => ({ ...f, terms: next }));
                                  }}
                                  min={1}
                                  max={52}
                                />
                              </div>
                            </div>
                          </RowShell>
                        ))}
                      </ListEditor>
                    </div>
                  ))}
              </div>
            ) : null}

            {state.success ? (
              <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
                Blueprint saved.
              </p>
            ) : state.error ? (
              <p className="mt-4 text-sm text-destructive">{state.error}</p>
            ) : null}
          </div>
        </div>

        <WizardFooter
          currentStep={step}
          totalSteps={STEPS.length}
          pending={pending}
          onBack={() => setStep((s) => Math.max(1, s - 1))}
          onNext={updateGateway}
          onPublish={publish}
        />
      </div>
    </div>
  );
}