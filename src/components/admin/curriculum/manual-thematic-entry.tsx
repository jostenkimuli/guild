"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import {
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  LayersIcon,
  ListChecksIcon,
  MapPinIcon,
  PackageCheckIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  MockThematicStrandId,
  ThematicManualAssessmentGroup,
  ThematicManualCycleRow,
  ThematicManualEntry,
  ThematicManualLearningArea,
  ThematicManualPeriodRow,
  ThematicManualStrandBlock,
  ThematicManualSubTheme,
  ThematicManualTheme,
} from "@/lib/playground/thematic-curriculum";

type Icon = ComponentType<{ className?: string }>;

// ---------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------

function SectionHeading({ title, icon: Icon }: { title: string; icon: Icon }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3.5" />
      {title}
    </h3>
  );
}

function SimpleItems({
  items,
  onChange,
  placeholder,
  addLabel = "Add",
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft.trim();
    if (next) {
      onChange([...items, next]);
      setDraft("");
    }
  };
  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <Input
            value={item}
            placeholder={placeholder}
            className="h-7 text-sm"
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          placeholder={placeholder}
          className="h-7 text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outline" size="sm" type="button" onClick={add}>
          <PlusIcon />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function LabeledItems({
  title,
  icon: Icon,
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  title: string;
  icon: Icon;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionHeading title={title} icon={Icon} />
        <span className="text-xs tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>
      <SimpleItems
        items={items}
        onChange={onChange}
        placeholder={placeholder}
        addLabel={addLabel}
      />
    </section>
  );
}

function ChipList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft.trim();
    if (next) {
      onChange([...items, next]);
      setDraft("");
    }
  };
  return (
    <div className="space-y-1">
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-md border bg-card px-1.5 py-0.5 text-[11px] text-foreground/80"
            >
              <input
                value={item}
                className="w-24 bg-transparent outline-none"
                onChange={(event) => {
                  const next = [...items];
                  next[index] = event.target.value;
                  onChange(next);
                }}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-1">
        <Input
          value={draft}
          placeholder={placeholder}
          className="h-6 text-xs"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outline" size="xs" type="button" onClick={add}>
          <PlusIcon />
          Add
        </Button>
      </div>
    </div>
  );
}

function CoveragePill({
  label,
  icon: Icon,
  done,
  total,
}: {
  label: string;
  icon: Icon;
  done: number;
  total: number;
}) {
  const complete = total > 0 && done >= total;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        complete
          ? "border-primary/30 bg-primary/5 text-foreground/80"
          : "border-muted-foreground/20 bg-background text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
      <span className="text-[10px] uppercase">
        {complete ? "done" : `${done}/${total}`}
      </span>
    </span>
  );
}

function EmptySection({ hint }: { hint: string }) {
  return (
    <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
      {hint}
    </p>
  );
}

// ---------------------------------------------------------------
// Intent — cycles
// ---------------------------------------------------------------

function CycleEditor({
  cycles,
  onChange,
}: {
  cycles: ThematicManualCycleRow[];
  onChange: (next: ThematicManualCycleRow[]) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionHeading title="Cycles" icon={LayersIcon} />
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onChange([...cycles, { code: "", name: "", description: "" }])}
        >
          <PlusIcon />
          Add cycle
        </Button>
      </div>
      {cycles.length > 0 ? (
        <div className="space-y-2">
          {cycles.map((cycle, index) => (
            <div key={index} className="space-y-1.5 rounded-lg border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5">
                <Input
                  value={cycle.code}
                  placeholder="Code, e.g. Cycle 1"
                  className="h-7 w-28 text-sm"
                  onChange={(event) =>
                    onChange(
                      cycles.map((c, i) =>
                        i === index ? { ...c, code: event.target.value } : c,
                      ),
                    )
                  }
                />
                <Input
                  value={cycle.name}
                  placeholder="Name, e.g. Basic skills (P1–P3)"
                  className="h-7 text-sm"
                  onChange={(event) =>
                    onChange(
                      cycles.map((c, i) =>
                        i === index ? { ...c, name: event.target.value } : c,
                      ),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={() => onChange(cycles.filter((_, i) => i !== index))}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
              <Input
                value={cycle.description}
                placeholder="Description"
                className="h-7 text-sm"
                onChange={(event) =>
                  onChange(
                    cycles.map((c, i) =>
                      i === index ? { ...c, description: event.target.value } : c,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptySection hint="No cycles captured yet — add the cycle breakdown (e.g. Cycle 1 Basic skills, Cycle 2 Transition, Cycle 3 Subject-based)." />
      )}
    </section>
  );
}

// ---------------------------------------------------------------
// Content — themes (full matrix fidelity)
// ---------------------------------------------------------------

const STRANDS: { id: MockThematicStrandId; label: string }[] = [
  { id: "mathematics", label: "Mathematics" },
  { id: "literacy", label: "Literacy" },
  { id: "english", label: "English" },
  { id: "creative_performing_arts", label: "Creative Performing Arts" },
  { id: "life_skills", label: "Life Skills" },
  { id: "values", label: "Values" },
];

const STRAND_LABELS: Record<MockThematicStrandId, string> = Object.fromEntries(
  STRANDS.map((strand) => [strand.id, strand.label]),
) as Record<MockThematicStrandId, string>;

function ensureStrandBlocks(
  subTheme: ThematicManualSubTheme,
): ThematicManualStrandBlock[] {
  return STRANDS.map((strand) => {
    const existing = subTheme.blocks.find((block) => block.strand === strand.id);
    return existing ?? { strand: strand.id, heading: null, items: [] };
  });
}

function StrandBlockEditor({
  block,
  label,
  onChange,
}: {
  block: ThematicManualStrandBlock;
  label: string;
  onChange: (next: ThematicManualStrandBlock) => void;
}) {
  return (
    <div className="space-y-1 rounded-md border bg-muted/30 p-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-foreground/70">{label}</p>
        <Input
          value={block.heading ?? ""}
          placeholder="heading?"
          className="h-6 w-32 text-[11px]"
          onChange={(event) =>
            onChange({ ...block, heading: event.target.value || null })
          }
        />
      </div>
      <ChipList
        items={block.items}
        onChange={(items) => onChange({ ...block, items })}
        placeholder="competence"
      />
    </div>
  );
}

function SubThemeEditor({
  subTheme,
  onChange,
  onRemove,
}: {
  subTheme: ThematicManualSubTheme;
  onChange: (next: ThematicManualSubTheme) => void;
  onRemove: () => void;
}) {
  const blocks = ensureStrandBlocks(subTheme);
  const setBlock = (strand: MockThematicStrandId, next: ThematicManualStrandBlock) =>
    onChange({
      ...subTheme,
      blocks: blocks.map((block) => (block.strand === strand ? next : block)),
    });

  return (
    <div className="space-y-2 rounded-lg border bg-background p-2.5">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={subTheme.title}
          placeholder="Sub-theme title, e.g. People in our School (Titles and Names)"
          className="h-7 text-sm font-medium"
          onChange={(event) => onChange({ ...subTheme, title: event.target.value })}
        />
        <Button variant="ghost" size="icon-sm" type="button" onClick={onRemove}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Content column
        </p>
        <ChipList
          items={subTheme.content}
          onChange={(content) => onChange({ ...subTheme, content })}
          placeholder="content, e.g. Titles, Names"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Strand competences
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {blocks.map((block) => (
            <StrandBlockEditor
              key={block.strand}
              block={block}
              label={STRAND_LABELS[block.strand]}
              onChange={(next) => setBlock(block.strand, next)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AssessmentGroupList({
  groups,
  onChange,
}: {
  groups: ThematicManualAssessmentGroup[];
  onChange: (next: ThematicManualAssessmentGroup[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Assessment guidelines
        </p>
        <Button
          variant="outline"
          size="xs"
          type="button"
          onClick={() => onChange([...groups, { strand: "", items: [] }])}
        >
          <PlusIcon />
          Add group
        </Button>
      </div>
      {groups.length > 0 ? (
        groups.map((group, index) => (
          <div key={index} className="space-y-1.5 rounded-md border bg-muted/30 p-2">
            <div className="flex items-center gap-1.5">
              <Input
                value={group.strand}
                placeholder="Strand, e.g. Mathematics"
                className="h-6 text-xs"
                onChange={(event) =>
                  onChange(
                    groups.map((g, i) =>
                      i === index ? { ...g, strand: event.target.value } : g,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                onClick={() => onChange(groups.filter((_, i) => i !== index))}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
            <ChipList
              items={group.items}
              onChange={(items) =>
                onChange(
                  groups.map((g, i) => (i === index ? { ...g, items } : g)),
                )
              }
              placeholder="assessable item, e.g. Count to 5"
            />
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground">
          No guideline groups yet.
        </p>
      )}
    </div>
  );
}

function ThemeCard({
  theme,
  index,
  onChange,
  onRemove,
}: {
  theme: ThematicManualTheme;
  index: number;
  onChange: (next: ThematicManualTheme) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          Theme {index + 1}
        </span>
        <Input
          value={theme.code}
          placeholder="Code, e.g. Theme 1"
          className="h-7 w-32 text-sm"
          onChange={(event) => onChange({ ...theme, code: event.target.value })}
        />
        <Input
          value={theme.title}
          placeholder="Theme title, e.g. Our School"
          className="h-7 flex-1 text-sm font-medium"
          onChange={(event) => onChange({ ...theme, title: event.target.value })}
        />
        <Button variant="ghost" size="icon-sm" type="button" onClick={onRemove}>
          <XIcon className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Learning outcome
        </p>
        <Textarea
          value={theme.learning_outcome}
          placeholder="Expected learning outcome for this theme"
          className="min-h-10 text-sm"
          onChange={(event) =>
            onChange({ ...theme, learning_outcome: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Sub-themes
          </p>
          <Button
            variant="outline"
            size="xs"
            type="button"
            onClick={() =>
              onChange({
                ...theme,
                sub_themes: [
                  ...theme.sub_themes,
                  {
                    title: "",
                    content: [],
                    blocks: STRANDS.map((strand) => ({
                      strand: strand.id,
                      heading: null,
                      items: [],
                    })),
                  },
                ],
              })
            }
          >
            <PlusIcon />
            Add sub-theme
          </Button>
        </div>
        {theme.sub_themes.map((subTheme, subIndex) => (
          <SubThemeEditor
            key={subIndex}
            subTheme={subTheme}
            onChange={(next) =>
              onChange({
                ...theme,
                sub_themes: theme.sub_themes.map((s, i) =>
                  i === subIndex ? next : s,
                ),
              })
            }
            onRemove={() =>
              onChange({
                ...theme,
                sub_themes: theme.sub_themes.filter((_, i) => i !== subIndex),
              })
            }
          />
        ))}
        {theme.sub_themes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No sub-themes yet — each is one teaching week in the matrix.
          </p>
        ) : null}
      </div>

      <AssessmentGroupList
        groups={theme.assessment_guidelines}
        onChange={(assessment_guidelines) =>
          onChange({ ...theme, assessment_guidelines })
        }
      />
    </div>
  );
}

function emptyTheme(): ThematicManualTheme {
  return {
    code: "",
    title: "",
    learning_outcome: "",
    sub_themes: [],
    assessment_guidelines: [],
  };
}

// ---------------------------------------------------------------
// Content — standalone learning areas
// ---------------------------------------------------------------

function LearningAreaCard({
  area,
  onChange,
  onRemove,
}: {
  area: ThematicManualLearningArea;
  onChange: (next: ThematicManualLearningArea) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2">
        <Input
          value={area.code}
          placeholder="Code, e.g. CRE"
          className="h-7 w-28 font-mono text-sm"
          onChange={(event) => onChange({ ...area, code: event.target.value })}
        />
        <Input
          value={area.title}
          placeholder="Title, e.g. Christian Religious Education"
          className="h-7 flex-1 text-sm font-medium"
          onChange={(event) => onChange({ ...area, title: event.target.value })}
        />
        <Button variant="ghost" size="icon-sm" type="button" onClick={onRemove}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <Textarea
        value={area.outcome}
        placeholder="Learning outcome"
        className="min-h-10 text-sm"
        onChange={(event) => onChange({ ...area, outcome: event.target.value })}
      />
      <Input
        value={area.organisation}
        placeholder="Organisation, e.g. One annual theme — week-based content"
        className="h-7 text-sm"
        onChange={(event) => onChange({ ...area, organisation: event.target.value })}
      />
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Notes
        </p>
        <ChipList
          items={area.notes}
          onChange={(notes) => onChange({ ...area, notes })}
          placeholder="note"
        />
      </div>
    </div>
  );
}

function emptyLearningArea(): ThematicManualLearningArea {
  return { title: "", code: "", outcome: "", organisation: "", notes: [] };
}

// ---------------------------------------------------------------
// Learning & Teaching — weekly period allocation
// ---------------------------------------------------------------

function PeriodAllocationEditor({
  rows,
  onChange,
}: {
  rows: ThematicManualPeriodRow[];
  onChange: (next: ThematicManualPeriodRow[]) => void;
}) {
  const total = rows.reduce(
    (sum, row) => sum + (Number.isFinite(row.periods) ? row.periods : 0),
    0,
  );
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionHeading title="Weekly allocation of periods" icon={ClockIcon} />
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => onChange([...rows, { strand: "", periods: 0 }])}
        >
          <PlusIcon />
          Add row
        </Button>
      </div>
      {rows.length > 0 ? (
        <div className="space-y-1.5">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Input
                value={row.strand}
                placeholder="Learning area, e.g. Mathematics"
                className="h-7 flex-1 text-sm"
                onChange={(event) =>
                  onChange(
                    rows.map((r, i) =>
                      i === index ? { ...r, strand: event.target.value } : r,
                    ),
                  )
                }
              />
              <Input
                type="number"
                min={0}
                value={Number.isFinite(row.periods) ? row.periods : 0}
                className="h-7 w-16 text-sm"
                onChange={(event) =>
                  onChange(
                    rows.map((r, i) =>
                      i === index
                        ? { ...r, periods: Math.max(0, Number.parseInt(event.target.value, 10) || 0) }
                        : r,
                    ),
                  )
                }
              />
              <Input
                value={row.note ?? ""}
                placeholder="note (optional)"
                className="h-7 w-40 text-sm"
                onChange={(event) =>
                  onChange(
                    rows.map((r, i) =>
                      i === index
                        ? { ...r, note: event.target.value.trim() ? event.target.value : undefined }
                        : r,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ))}
          <p className="text-xs font-medium tabular-nums text-muted-foreground">
            {total} periods per week
          </p>
        </div>
      ) : (
        <EmptySection hint="No period rows captured yet — e.g. Mathematics 5, English 5, PE 5, …" />
      )}
    </section>
  );
}

// ---------------------------------------------------------------
// Manual thematic entry — the four anatomy tabs
// ---------------------------------------------------------------

export function ManualThematicEntry({
  value,
  onChange,
}: {
  value: ThematicManualEntry;
  onChange: (next: ThematicManualEntry) => void;
}) {
  const themes = value.content.themes;
  const setTheme = (index: number, next: ThematicManualTheme) =>
    onChange({
      ...value,
      content: {
        ...value.content,
        themes: themes.map((theme, i) => (i === index ? next : theme)),
      },
    });

  const intentDone = [
    value.intent.cycles.some((cycle) => cycle.name.trim().length > 0),
    value.intent.national_aims.some((aim) => aim.trim().length > 0),
    value.intent.aims_of_primary_education.some((aim) => aim.trim().length > 0),
    themes.some((theme) => theme.learning_outcome.trim().length > 0),
  ].filter(Boolean).length;

  const contentDone = [themes.length > 0, value.content.learning_areas.length > 0].filter(
    Boolean,
  ).length;

  const teachingDone = [
    value.learning_teaching.approach.length > 0,
    value.learning_teaching.medium_of_instruction.trim().length > 0,
    value.learning_teaching.learning_resources.length > 0,
    value.learning_teaching.period_allocation.length > 0,
    value.learning_teaching.timetable_notes.length > 0,
  ].filter(Boolean).length;

  const assessmentDone = [
    value.assessment.assessment_approach.length > 0,
    themes.some((theme) =>
      theme.assessment_guidelines.some((group) => group.items.some(Boolean)),
    ),
  ].filter(Boolean).length;

  return (
    <Tabs defaultValue="intent" className="w-full">
      <TabsList variant="line" className="w-fit">
        <TabsTrigger value="intent">Intent</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="teaching">Learning & Teaching</TabsTrigger>
        <TabsTrigger value="assessment">Assessment</TabsTrigger>
      </TabsList>
      <div className="flex flex-wrap gap-1.5 pb-1 pt-1.5">
        <CoveragePill label="Intent" icon={TargetIcon} done={intentDone} total={4} />
        <CoveragePill label="Content" icon={LayersIcon} done={contentDone} total={2} />
        <CoveragePill
          label="Learning & Teaching"
          icon={BookOpenIcon}
          done={teachingDone}
          total={5}
        />
        <CoveragePill
          label="Assessment"
          icon={FileTextIcon}
          done={assessmentDone}
          total={2}
        />
      </div>

      <TabsContent value="intent" className="space-y-5">
        <CycleEditor
          cycles={value.intent.cycles}
          onChange={(cycles) =>
            onChange({ ...value, intent: { ...value.intent, cycles } })
          }
        />
        <LabeledItems
          title="National aims of education"
          icon={ShieldCheckIcon}
          items={value.intent.national_aims}
          placeholder="e.g. To promote understanding and appreciation of national unity…"
          onChange={(national_aims) =>
            onChange({ ...value, intent: { ...value.intent, national_aims } })
          }
        />
        <LabeledItems
          title="Aims of primary education"
          icon={TargetIcon}
          items={value.intent.aims_of_primary_education}
          placeholder="e.g. To enable individuals to acquire functional, permanent literacy…"
          onChange={(aims_of_primary_education) =>
            onChange({
              ...value,
              intent: { ...value.intent, aims_of_primary_education },
            })
          }
        />
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionHeading title="Per-theme learning outcomes" icon={SparklesIcon} />
            <span className="text-xs tabular-nums text-muted-foreground">
              {themes.filter((theme) => theme.learning_outcome.trim().length > 0).length}
            </span>
          </div>
          {themes.length > 0 ? (
            <div className="space-y-2">
              {themes.map((theme, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5"
                >
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={theme.learning_outcome}
                    placeholder={`${theme.title || `Theme ${index + 1}`} — learning outcome`}
                    className="h-7 text-sm"
                    onChange={(event) =>
                      setTheme(index, { ...theme, learning_outcome: event.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptySection hint="No themes yet — add themes under the Content tab and their learning outcomes will appear here." />
          )}
        </section>
      </TabsContent>

      <TabsContent value="content" className="space-y-5">
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SectionHeading title="Themes" icon={MapPinIcon} />
            <span className="text-xs tabular-nums text-muted-foreground">
              {themes.length} themes
            </span>
          </div>
          {themes.length > 0 ? (
            <div className="space-y-3">
              {themes.map((theme, index) => (
                <ThemeCard
                  key={index}
                  theme={theme}
                  index={index}
                  onChange={(next) => setTheme(index, next)}
                  onRemove={() =>
                    onChange({
                      ...value,
                      content: {
                        ...value.content,
                        themes: themes.filter((_, i) => i !== index),
                      },
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <EmptySection hint="No themes captured yet — each theme holds its sub-themes (teaching weeks) and strand competence matrix." />
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  content: { ...value.content, themes: [...themes, emptyTheme()] },
                })
              }
            >
              <PlusIcon />
              Add theme
            </Button>
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SectionHeading title="Standalone learning areas" icon={BookOpenIcon} />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  content: {
                    ...value.content,
                    learning_areas: [...value.content.learning_areas, emptyLearningArea()],
                  },
                })
              }
            >
              <PlusIcon />
              Add area
            </Button>
          </div>
          {value.content.learning_areas.length > 0 ? (
            <div className="space-y-2">
              {value.content.learning_areas.map((area, index) => (
                <LearningAreaCard
                  key={index}
                  area={area}
                  onChange={(next) =>
                    onChange({
                      ...value,
                      content: {
                        ...value.content,
                        learning_areas: value.content.learning_areas.map((a, i) =>
                          i === index ? next : a,
                        ),
                      },
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...value,
                      content: {
                        ...value.content,
                        learning_areas: value.content.learning_areas.filter(
                          (_, i) => i !== index,
                        ),
                      },
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <EmptySection hint="No standalone learning areas yet — e.g. CRE, IRE, PE keep the 1999 framework outside the thematic strand." />
          )}
        </section>
      </TabsContent>

      <TabsContent value="teaching" className="space-y-5">
        <LabeledItems
          title="Organisational approach"
          icon={SparklesIcon}
          items={value.learning_teaching.approach}
          placeholder="e.g. Content is arranged in a matrix — themes run horizontally…"
          onChange={(approach) =>
            onChange({
              ...value,
              learning_teaching: { ...value.learning_teaching, approach },
            })
          }
        />
        <section className="space-y-1.5">
          <SectionHeading title="Medium of instruction" icon={BookOpenIcon} />
          <Textarea
            value={value.learning_teaching.medium_of_instruction}
            placeholder="e.g. All P1–P3 learning materials are provided in the child's own or a familiar language…"
            className="min-h-10 text-sm"
            onChange={(event) =>
              onChange({
                ...value,
                learning_teaching: {
                  ...value.learning_teaching,
                  medium_of_instruction: event.target.value,
                },
              })
            }
          />
        </section>
        <LabeledItems
          title="Learning resources"
          icon={PackageCheckIcon}
          items={value.learning_teaching.learning_resources}
          placeholder="e.g. Flash cards and word/sentence cards"
          onChange={(learning_resources) =>
            onChange({
              ...value,
              learning_teaching: { ...value.learning_teaching, learning_resources },
            })
          }
        />
        <PeriodAllocationEditor
          rows={value.learning_teaching.period_allocation}
          onChange={(period_allocation) =>
            onChange({
              ...value,
              learning_teaching: { ...value.learning_teaching, period_allocation },
            })
          }
        />
        <LabeledItems
          title="Timetable notes"
          icon={ListChecksIcon}
          items={value.learning_teaching.timetable_notes}
          placeholder="e.g. Literacy I and Literacy II lessons should follow one another"
          onChange={(timetable_notes) =>
            onChange({
              ...value,
              learning_teaching: { ...value.learning_teaching, timetable_notes },
            })
          }
        />
      </TabsContent>

      <TabsContent value="assessment" className="space-y-5">
        <LabeledItems
          title="Approach to assessment"
          icon={FileTextIcon}
          items={value.assessment.assessment_approach}
          placeholder="e.g. Assessment is built into the curriculum — no separate tests…"
          onChange={(assessment_approach) =>
            onChange({ ...value, assessment: { assessment_approach } })
          }
        />
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SectionHeading title="Per-theme assessment guidelines" icon={ListChecksIcon} />
            <span className="text-xs tabular-nums text-muted-foreground">
              {themes.filter((theme) =>
                theme.assessment_guidelines.some((group) => group.items.some(Boolean)),
              ).length}{" "}
              themes
            </span>
          </div>
          {themes.length > 0 ? (
            <div className="space-y-2.5">
              {themes.map((theme, index) => (
                <div key={index} className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {theme.code || `Theme ${index + 1}`}
                    </span>
                    <p className="text-sm font-semibold">
                      {theme.title || "Untitled theme"}
                    </p>
                  </div>
                  <AssessmentGroupList
                    groups={theme.assessment_guidelines}
                    onChange={(assessment_guidelines) =>
                      setTheme(index, { ...theme, assessment_guidelines })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptySection hint="No themes yet — add themes under the Content tab and their assessment guidelines will appear here." />
          )}
        </section>
      </TabsContent>
    </Tabs>
  );
}