"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChurchIcon,
  CircleDashedIcon,
  ClockIcon,
  DumbbellIcon,
  FileTextIcon,
  LayersIcon,
  ListChecksIcon,
  MapPinIcon,
  MoonIcon,
  PackageCheckIcon,
  PencilIcon,
  PlusIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type MockCompetenceType,
  type MockCurriculumComponentId,
  type MockCurriculumOutcome,
  type MockNationalTemplate,
  type MockSyllabusAssessmentType,
  type MockSyllabusView,
  type MockTemplateStatus,
  getLevelsForTemplate,
  getSubjectsForTemplate,
  getSyllabiForTemplate,
  getSyllabusViewById,
  getTemplateById,
  getTopicsForSyllabus,
  mockNationalTemplates,
  createNationalTemplateDraft,
} from "@/lib/playground/mock";
import {
  type MockThematicCurriculum,
  type MockThematicStrandId,
  type MockThematicSubTheme,
  type MockThematicTheme,
  getThemeById,
  getThematicCurricula,
  getThematicCurriculum,
  getThematicCurriculumById,
  getThematicStats,
  createThematicCurriculumDraft,
  applyThematicManualEntry,
  applyThematicDraftIdentity,
  type ThematicDraftIdentity,
  type ThematicManualEntry,
  mockThematicCurricula,
} from "@/lib/playground/thematic-curriculum";
import {
  DocumentOnboardingDialog,
  type OnboardingStructureType,
} from "@/components/admin/curriculum/document-onboarding-dialog";
import { ThematicDraftEditor } from "@/components/admin/curriculum/thematic-draft-editor";

type Icon = ComponentType<{ className?: string }>;

const STATUS_META: Record<
  MockTemplateStatus,
  { label: string; variant: "secondary" | "outline" | "ghost"; icon: Icon }
> = {
  published: { label: "Published", variant: "secondary", icon: CheckCircle2Icon },
  draft: { label: "Draft", variant: "outline", icon: CircleDashedIcon },
  archived: { label: "Archived", variant: "ghost", icon: ArchiveIcon },
};

const COMPETENCE_META: Record<
  MockCompetenceType,
  { label: string; variant: "default" | "secondary" | "outline"; icon: Icon }
> = {
  knowledge: { label: "Knowledge", variant: "secondary", icon: BookOpenIcon },
  skill: { label: "Skill", variant: "default", icon: TargetIcon },
  attitude: { label: "Attitude", variant: "outline", icon: SparklesIcon },
  value: { label: "Value", variant: "outline", icon: SparklesIcon },
};

function StatusBadge({ status }: { status: MockTemplateStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon />
      {meta.label}
    </Badge>
  );
}

function SectionHeading({
  title,
  icon: Icon,
}: {
  title: string;
  icon: Icon;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3.5" />
      {title}
    </h3>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground/80">
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: Icon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background/60 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// The four universal curriculum components — the fixed anatomy every
// curriculum document (subject-based or thematic) renders from.
// ---------------------------------------------------------------

const CURRICULUM_COMPONENTS: {
  id: MockCurriculumComponentId;
  label: string;
  short: string;
  icon: Icon;
}[] = [
  { id: "intent", label: "Intent", short: "Aims & objectives", icon: TargetIcon },
  { id: "content", label: "Content", short: "Subject matter", icon: LayersIcon },
  {
    id: "learning_teaching",
    label: "Learning & Teaching",
    short: "Learning experiences",
    icon: BookOpenIcon,
  },
  { id: "assessment", label: "Assessment", short: "Evaluation", icon: FileTextIcon },
];

const ASSESSMENT_TYPE_META: Record<
  MockSyllabusAssessmentType,
  { label: string; icon: Icon }
> = {
  observation: { label: "Observation", icon: CheckCircle2Icon },
  continuous_assessment: { label: "Continuous assessment", icon: ClockIcon },
  examination: { label: "Examination", icon: FileTextIcon },
  project: { label: "Project", icon: LayersIcon },
  portfolio: { label: "Portfolio", icon: PackageCheckIcon },
};

function ComponentCoverage({
  present,
}: {
  present: Record<MockCurriculumComponentId, boolean>;
}) {
  const covered = CURRICULUM_COMPONENTS.filter(
    (component) => present[component.id],
  ).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {CURRICULUM_COMPONENTS.map((component) => {
          const ok = present[component.id];
          const Icon = component.icon;
          return (
            <span
              key={component.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                ok
                  ? "border-primary/30 bg-primary/5 text-foreground/80"
                  : "border-muted-foreground/20 bg-background text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {component.label}
              {ok ? null : <span className="text-[10px] uppercase">missing</span>}
            </span>
          );
        })}
      </div>
      <Badge variant={covered === 4 ? "secondary" : "outline"}>
        {covered}/{CURRICULUM_COMPONENTS.length} components
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------
// Template list (aside)
// ---------------------------------------------------------------

function TemplateList({
  selectedId,
  onSelect,
  onRequestNew,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onRequestNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">National templates</h2>
        <Badge variant="outline">{mockNationalTemplates.length}</Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onRequestNew}
      >
        <PlusIcon />
        New template
      </Button>

      <div className="space-y-2">
        {mockNationalTemplates.map((template) => {
          const selected = template.id === selectedId;
          const meta = STATUS_META[template.status];
          const Icon = meta.icon;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ScrollTextIcon className="size-4 text-primary" />
                  <p className="text-sm font-semibold">{template.name}</p>
                </div>
                <Badge variant={meta.variant}>
                  <Icon />
                  {meta.label}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {template.code}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {template.country} · {template.year} · v{template.version}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum list (aside)
// ---------------------------------------------------------------

function ThematicCurriculumList({
  selectedId,
  onSelect,
  onRequestNew,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onRequestNew: () => void;
}) {
  const curricula = getThematicCurricula();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Thematic curricula</h2>
        <Badge variant="outline">{curricula.length}</Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onRequestNew}
      >
        <PlusIcon />
        New curriculum
      </Button>

      <div className="space-y-2">
        {curricula.map((curriculum) => {
          const selected = curriculum.id === selectedId;
          const meta = STATUS_META[curriculum.status];
          const Icon = meta.icon;
          return (
            <button
              key={curriculum.id}
              type="button"
              onClick={() => onSelect(curriculum.id)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "bg-card hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="size-4 text-primary" />
                  <p className="text-sm font-semibold">{curriculum.name}</p>
                </div>
                <Badge variant={meta.variant}>
                  <Icon />
                  {meta.label}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Badge variant="secondary">{curriculum.level}</Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {curriculum.code}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {curriculum.year_note} · v{curriculum.version}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Template detail — Intent tab (aims, values, skills)
// ---------------------------------------------------------------

function TemplateIntentTab({ template }: { template: MockNationalTemplate }) {
  const hasAims =
    (template.national_aims?.length ?? 0) > 0 ||
    (template.aims_of_primary_education?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      {hasAims ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-3">
            <SectionHeading title="National aims of education" icon={ShieldCheckIcon} />
            {template.national_aims && template.national_aims.length > 0 ? (
              <ol className="space-y-2">
                {template.national_aims.map((aim, index) => (
                  <li key={aim} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="mt-0.5 shrink-0 font-semibold text-primary">
                      {String.fromCharCode(97 + index)})
                    </span>
                    <span>{aim}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Not specified.</p>
            )}
          </section>
          <section className="space-y-3">
            <SectionHeading title="Aims of primary education" icon={TargetIcon} />
            {template.aims_of_primary_education &&
            template.aims_of_primary_education.length > 0 ? (
              <ol className="space-y-2">
                {template.aims_of_primary_education.map((aim, index) => (
                  <li key={aim} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="mt-0.5 shrink-0 font-semibold text-primary">
                      {String.fromCharCode(97 + index)})
                    </span>
                    <span>{aim}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {template.aims_of_primary_education === null
                  ? "Not applicable to this template (outside the primary cycle)."
                  : "Not specified."}
              </p>
            )}
          </section>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No aims or objectives specified for this template yet.
        </p>
      )}

      <section className="space-y-3">
        <SectionHeading title="National values" icon={ShieldCheckIcon} />
        {template.values_text ? (
          <p className="rounded-lg border bg-muted/40 p-4 text-sm text-foreground/90">
            {template.values_text}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Not specified.</p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <SectionHeading title="Generic skills" icon={SparklesIcon} />
          {(template.generic_skills ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {template.generic_skills?.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not specified.</p>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeading title="Cross-cutting issues" icon={ListChecksIcon} />
          {(template.cross_cutting_issues ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {template.cross_cutting_issues?.map((issue) => (
                <Chip key={issue}>{issue}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not specified.</p>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Template detail — Content tab (scope, subjects, levels, syllabi)
// ---------------------------------------------------------------

function TemplateContentTab({
  template,
  syllabi,
  onOpenSyllabus,
}: {
  template: MockNationalTemplate;
  syllabi: MockSyllabusView[];
  onOpenSyllabus: (id: string) => void;
}) {
  const topicCount = syllabi.reduce(
    (sum, syllabus) => sum + getTopicsForSyllabus(syllabus.id).length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeading title="Scope and sequence" icon={LayersIcon} />
        <Badge variant="outline">{topicCount} syllabus topics</Badge>
      </div>
      <StructureTab template={template} />
      <SyllabiTab syllabi={syllabi} onOpen={onOpenSyllabus} />
    </div>
  );
}

// ---------------------------------------------------------------
// Template detail — Learning & Teaching tab
// ---------------------------------------------------------------

function TemplateTeachingTab({ template }: { template: MockNationalTemplate }) {
  const maxMinutes = Math.max(
    ...(template.time_allocation ?? []).map((row) => row.weekly_minutes),
    1,
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading title="Recommended pedagogy" icon={BookOpenIcon} />
        {template.pedagogy_text ? (
          <p className="text-sm text-foreground/90">{template.pedagogy_text}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Not specified.</p>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading title="Time allocation" icon={TargetIcon} />
        {(template.time_allocation ?? []).length > 0 ? (
          <div className="space-y-2">
            {template.time_allocation?.map((row) => (
              <div key={row.subject} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.subject}</span>
                  <span className="font-medium">{row.weekly_minutes} min/wk</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.weekly_minutes / maxMinutes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not specified.</p>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading title="Approved materials" icon={PackageCheckIcon} />
        {(template.approved_materials ?? []).length > 0 ? (
          <ul className="space-y-1.5">
            {template.approved_materials?.map((material) => (
              <li
                key={material}
                className="flex items-start gap-2 text-sm text-foreground/90"
              >
                <PackageCheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{material}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Not specified.</p>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Template detail — Assessment tab
// ---------------------------------------------------------------

function TemplateAssessmentTab({
  template,
  syllabi,
}: {
  template: MockNationalTemplate;
  syllabi: MockSyllabusView[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading title="Assessment requirements" icon={FileTextIcon} />
        {template.assessment_requirements ? (
          <ul className="space-y-2">
            {[
              template.assessment_requirements.continuous_assessment,
              template.assessment_requirements.examinations,
              template.assessment_requirements.promotion_rules,
            ]
              .filter(Boolean)
              .map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-2 text-sm text-foreground/90"
                >
                  <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Not specified.</p>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading title="Syllabus assessment plans" icon={ListChecksIcon} />
        {syllabi.length > 0 ? (
          <div className="space-y-3">
            {syllabi.map((syllabus) => {
              const plan = syllabus.assessment_plan ?? [];
              return (
                <div key={syllabus.id} className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{syllabus.title}</p>
                    <Badge variant="outline">
                      {plan.length > 0 ? `${plan.length} assessments` : "No plan yet"}
                    </Badge>
                  </div>
                  {plan.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {plan.map((row) => {
                        const meta = ASSESSMENT_TYPE_META[row.type];
                        const Icon = meta.icon;
                        return (
                          <li
                            key={row.id}
                            className="flex items-start gap-2 text-sm text-foreground/80"
                          >
                            <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            <span>
                              <span className="font-medium">{row.title}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                · {meta.label}
                                {row.weight_pct !== null ? ` · ${row.weight_pct}%` : ""}
                                {row.when ? ` · ${row.when}` : ""}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No assessment plan defined yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No syllabi yet.</p>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Template detail — Subjects & Levels tab
// ---------------------------------------------------------------

function StructureTab({
  template,
}: {
  template: MockNationalTemplate;
}) {
  const subjects = getSubjectsForTemplate(template.id);
  const levels = getLevelsForTemplate(template.id);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>
            National learning areas of {template.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="text-muted-foreground">
                      {subject.sequence}
                    </TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {subject.code}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No subjects yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Levels</CardTitle>
          <CardDescription>
            Academic levels covered by the template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {levels.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="text-muted-foreground">
                      {level.sequence}
                    </TableCell>
                    <TableCell className="font-medium">{level.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No levels yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
// Template detail — Syllabi tab
// ---------------------------------------------------------------

function SyllabiTab({
  syllabi,
  onOpen,
}: {
  syllabi: MockSyllabusView[];
  onOpen: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject syllabi</CardTitle>
        <CardDescription>
          One syllabus per subject × level. Select a row to review its learning
          outcomes and measurable indicators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {syllabi.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Syllabus</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Outcomes</TableHead>
                <TableHead>Indicators</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syllabi.map((syllabus) => (
                <TableRow
                  key={syllabus.id}
                  className="cursor-pointer"
                  onClick={() => onOpen(syllabus.id)}
                >
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {syllabus.code}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{syllabus.title}</TableCell>
                  <TableCell>{syllabus.subject?.name ?? "—"}</TableCell>
                  <TableCell>{syllabus.level?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{syllabus.outcomes.length}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {syllabus.outcomes.reduce(
                      (sum, outcome) => sum + outcome.indicators.length,
                      0,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No syllabi yet. Create one from the definition editor.
          </p>
        )}
      </CardContent>
      {syllabi.length > 0 ? (
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          Rows in this preview are clickable — review a syllabus below.
        </CardFooter>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------
// Template detail
// ---------------------------------------------------------------

function TemplateDetail({
  template,
  syllabi,
  onOpenSyllabus,
}: {
  template: MockNationalTemplate;
  syllabi: MockSyllabusView[];
  onOpenSyllabus: (id: string) => void;
}) {
  const subjects = getSubjectsForTemplate(template.id);
  const levels = getLevelsForTemplate(template.id);
  const outcomeCount = syllabi.reduce(
    (sum, syllabus) => sum + syllabus.outcomes.length,
    0,
  );
  const isPublished = template.status === "published";
  const actionLabel = isPublished ? "Archive" : "Publish";

  const coverage: Record<MockCurriculumComponentId, boolean> = {
    intent:
      (template.national_aims?.length ?? 0) > 0 ||
      (template.aims_of_primary_education?.length ?? 0) > 0 ||
      (template.generic_skills?.length ?? 0) > 0,
    content:
      syllabi.length > 0 ||
      syllabi.some((syllabus) => getTopicsForSyllabus(syllabus.id).length > 0),
    learning_teaching:
      template.pedagogy_text !== null ||
      (template.approved_materials?.length ?? 0) > 0 ||
      syllabi.some((syllabus) => (syllabus.teaching_strategies?.length ?? 0) > 0),
    assessment:
      template.assessment_requirements !== null ||
      syllabi.some((syllabus) => (syllabus.assessment_plan?.length ?? 0) > 0),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <StatusBadge status={template.status} />
              <Badge variant="outline">v{template.version}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                title="Design preview — not wired"
              >
                <PlusIcon />
                New template
              </Button>
              <Button
                variant="outline"
                size="sm"
                title="Design preview — not wired"
              >
                <PencilIcon />
                Edit
              </Button>
              <Button
                size="sm"
                title="Design preview — not wired"
              >
                {isPublished ? <ArchiveIcon /> : <CheckCircle2Icon />}
                {actionLabel}
              </Button>
            </div>
          </div>
          <CardDescription>
            <span className="font-mono text-xs">{template.code}</span>
            <span className="mx-1.5">·</span>
            {template.country}
            <span className="mx-1.5">·</span>
            {template.year}
            <span className="mx-1.5">·</span>
            {template.published_at
              ? `published ${new Date(template.published_at).toLocaleDateString()}`
              : "not published"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Subjects"
              value={subjects.length}
              icon={LayersIcon}
            />
            <Stat label="Levels" value={levels.length} icon={BookOpenIcon} />
            <Stat label="Syllabi" value={syllabi.length} icon={ScrollTextIcon} />
            <Stat label="Outcomes" value={outcomeCount} icon={TargetIcon} />
          </div>
        </CardContent>
      </Card>

      <ComponentCoverage present={coverage} />

      <Tabs defaultValue="intent">
        <TabsList variant="line">
          <TabsTrigger value="intent">Intent</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="teaching">Learning & Teaching</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="intent">
          <TemplateIntentTab template={template} />
        </TabsContent>
        <TabsContent value="content">
          <TemplateContentTab
            template={template}
            syllabi={syllabi}
            onOpenSyllabus={onOpenSyllabus}
          />
        </TabsContent>
        <TabsContent value="teaching">
          <TemplateTeachingTab template={template} />
        </TabsContent>
        <TabsContent value="assessment">
          <TemplateAssessmentTab template={template} syllabi={syllabi} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------
// Syllabus detail
// ---------------------------------------------------------------

function SyllabusDetail({
  syllabus,
  template,
  onBack,
}: {
  syllabus: MockSyllabusView;
  template: MockNationalTemplate;
  onBack: () => void;
}) {
  const indicatorCount = syllabus.outcomes.reduce(
    (sum, outcome) => sum + outcome.indicators.length,
    0,
  );
  const topics = getTopicsForSyllabus(syllabus.id);

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeftIcon />
        Back to {template.name}
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{syllabus.title}</CardTitle>
            <Badge variant="secondary">{syllabus.subject?.name ?? "Subject"}</Badge>
            <Badge variant="secondary">{syllabus.level?.name ?? "Level"}</Badge>
            <Badge variant="outline">{syllabus.outcomes.length} outcomes</Badge>
            <Badge variant="outline">{indicatorCount} indicators</Badge>
          </div>
          <CardDescription>
            <span className="font-mono text-xs">{syllabus.code}</span>
            <span className="mx-1.5">·</span>
            Part of {template.name} (v{template.version})
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="intent">
        <TabsList variant="line">
          <TabsTrigger value="intent">Intent</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="teaching">Learning & Teaching</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="intent" className="space-y-3">
          <SectionHeading
            title="Learning outcomes & measurable indicators"
            icon={TargetIcon}
          />
          {syllabus.outcomes.length > 0 ? (
            <div className="space-y-3">
              {syllabus.outcomes.map((outcome) => (
                <OutcomeCard key={outcome.id} outcome={outcome} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No outcomes defined for this syllabus yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          <SectionHeading title="Scope and sequence" icon={LayersIcon} />
          {topics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell className="text-muted-foreground">
                      {topic.sequence}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {topic.code}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{topic.title}</TableCell>
                    <TableCell>
                      {topic.duration_weeks ? `${topic.duration_weeks} weeks` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {topic.description ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No topics defined for this syllabus yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="teaching" className="space-y-6">
          {syllabus.pedagogy_notes ? (
            <section className="space-y-1.5">
              <SectionHeading title="Pedagogy notes" icon={BookOpenIcon} />
              <p className="text-sm text-foreground/90">{syllabus.pedagogy_notes}</p>
            </section>
          ) : null}
          {(syllabus.teaching_strategies ?? []).length > 0 ? (
            <section className="space-y-1.5">
              <SectionHeading title="Teaching strategies" icon={SparklesIcon} />
              <ul className="space-y-1.5">
                {syllabus.teaching_strategies?.map((strategy) => (
                  <li
                    key={strategy}
                    className="flex items-start gap-2 text-sm text-foreground/90"
                  >
                    <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {(syllabus.typical_activities ?? []).length > 0 ? (
            <section className="space-y-1.5">
              <SectionHeading title="Typical activities" icon={ListChecksIcon} />
              <div className="flex flex-wrap gap-1.5">
                {syllabus.typical_activities?.map((activity) => (
                  <Chip key={activity}>{activity}</Chip>
                ))}
              </div>
            </section>
          ) : null}
          {syllabus.time_allocation ? (
            <section className="space-y-1.5">
              <SectionHeading title="Time allocation" icon={TargetIcon} />
              <p className="text-sm text-foreground/90">{syllabus.time_allocation}</p>
            </section>
          ) : null}
          {(syllabus.approved_materials ?? []).length > 0 ? (
            <section className="space-y-1.5">
              <SectionHeading title="Approved materials" icon={PackageCheckIcon} />
              <ul className="space-y-1.5">
                {syllabus.approved_materials?.map((material) => (
                  <li
                    key={material}
                    className="flex items-start gap-2 text-sm text-foreground/90"
                  >
                    <PackageCheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          {syllabus.assessment_requirements ? (
            <section className="space-y-1.5">
              <SectionHeading title="Assessment requirements" icon={FileTextIcon} />
              <p className="text-sm text-foreground/90">
                {syllabus.assessment_requirements}
              </p>
            </section>
          ) : null}
          <section className="space-y-1.5">
            <SectionHeading title="Assessment plan" icon={ListChecksIcon} />
            {(syllabus.assessment_plan ?? []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>What</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(syllabus.assessment_plan ?? []).map((row) => {
                    const meta = ASSESSMENT_TYPE_META[row.type];
                    const Icon = meta.icon;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Badge variant="outline">
                            <Icon />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{row.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {row.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          {row.weight_pct !== null ? `${row.weight_pct}%` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.when ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No assessment plan defined yet.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The measurable indicators shown under Intent are the evidence each
              plan row records.
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------
// Outcome card (with measurable indicators)
// ---------------------------------------------------------------

function OutcomeCard({ outcome }: { outcome: MockCurriculumOutcome }) {
  const competence = COMPETENCE_META[outcome.competence_type];
  const CompetenceIcon = competence.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-semibold text-primary">
                {outcome.sequence}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {outcome.code}
                </span>
                <Badge variant={competence.variant}>
                  <CompetenceIcon />
                  {competence.label}
                </Badge>
              </div>
              <p className="text-[0.95rem] font-medium leading-snug">
                {outcome.description}
              </p>
            </div>
          </div>
          <Badge variant="outline">{outcome.indicators.length} indicators</Badge>
        </div>

        {outcome.indicators.length > 0 ? (
          <ul className="mt-4 space-y-1.5 border-l-2 border-primary/20 pl-4">
            {outcome.indicators.map((indicator) => (
              <li
                key={indicator.id}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                <span>{indicator.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No measurable indicators defined yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------
// Mode switch — the two national-standard structure types
// ---------------------------------------------------------------

type PreviewMode = "templates" | "thematic";

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}) {
  const options: { value: PreviewMode; label: string; icon: Icon }[] = [
    { value: "templates", label: "National templates (syllabi)", icon: FileTextIcon },
    { value: "thematic", label: "Thematic curriculum (P1–P3)", icon: MapPinIcon },
  ];

  return (
    <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum (P1–P3) — document header
// ---------------------------------------------------------------

function FidelityBadge({
  fidelity,
}: {
  fidelity: MockThematicTheme["fidelity"];
}) {
  return fidelity === "mirrored" ? (
    <Badge variant="secondary">
      <CheckCircle2Icon />
      Mirrored from source
    </Badge>
  ) : (
    <Badge variant="outline">Outline</Badge>
  );
}

function ThematicDocumentCard({
  curriculum,
  onEdit,
}: {
  curriculum: MockThematicCurriculum;
  onEdit?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{curriculum.name}</CardTitle>
            <StatusBadge status={curriculum.status} />
            <Badge variant="secondary">
              <MapPinIcon />
              Thematic · {curriculum.level}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {curriculum.status === "draft" && onEdit ? (
              <Button variant="outline" size="sm" type="button" onClick={onEdit}>
                <PencilIcon />
                Edit
              </Button>
            ) : null}
            <Button size="sm" title="Design preview — not wired">
              <ArchiveIcon />
              Archive
            </Button>
          </div>
        </div>
        <CardDescription>
          <span className="font-mono text-xs">{curriculum.code}</span>
          <span className="mx-1.5">·</span>
          {curriculum.issuer}
        </CardDescription>
        <CardDescription>
          {curriculum.country} · {curriculum.year_note} · {curriculum.isbn}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/90">{curriculum.document_note}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum — Intent tab
// ---------------------------------------------------------------

function ThematicIntentTab({
  curriculum,
}: {
  curriculum: MockThematicCurriculum;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading title="Cycles" icon={LayersIcon} />
        <div className="grid gap-3">
          {curriculum.cycles.map((cycle) => (
            <div key={cycle.code} className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{cycle.code}</Badge>
                <p className="text-sm font-semibold">{cycle.name}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{cycle.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <SectionHeading title="National aims of education" icon={ShieldCheckIcon} />
          <ol className="space-y-2">
            {curriculum.national_aims.map((aim, index) => (
              <li key={aim} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  {String.fromCharCode(97 + index)})
                </span>
                <span>{aim}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <SectionHeading title="Aims of primary education" icon={TargetIcon} />
          <ol className="space-y-2">
            {curriculum.aims_of_primary_education.map((aim, index) => (
              <li key={aim} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-0.5 shrink-0 font-semibold text-primary">
                  {String.fromCharCode(97 + index)})
                </span>
                <span>{aim}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="space-y-3">
        <SectionHeading title="Per-theme learning outcomes" icon={TargetIcon} />
        {curriculum.themes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {curriculum.themes.map((theme) => (
              <div key={theme.id} className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm font-semibold">
                  <span className="font-mono text-xs text-muted-foreground">
                    {theme.code}
                  </span>{" "}
                  {theme.title}
                </p>
                {theme.learning_outcome ? (
                  <p className="mt-1 text-sm text-foreground/80">{theme.learning_outcome}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Not specified yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No themes transcribed yet.</p>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum — Content tab
// ---------------------------------------------------------------

function ThematicContentTab({
  curriculum,
  onOpenTheme,
}: {
  curriculum: MockThematicCurriculum;
  onOpenTheme: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      {curriculum.themes.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {curriculum.themes.map((theme) => (
            <ThematicThemeCard key={theme.id} theme={theme} onOpen={onOpenTheme} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No themes transcribed yet.</p>
      )}

      <section className="space-y-3">
        <SectionHeading title="Standalone learning areas" icon={BookOpenIcon} />
        <LearningAreasTab curriculum={curriculum} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum — Learning & Teaching tab
// ---------------------------------------------------------------

function ThematicLearningTeachingTab({
  curriculum,
}: {
  curriculum: MockThematicCurriculum;
}) {
  const maxPeriods = Math.max(
    ...curriculum.period_allocation.map((row) => row.periods),
    1,
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading title="Organisational approach" icon={SparklesIcon} />
        {curriculum.approach.length > 0 ? (
          <ul className="space-y-2">
            {curriculum.approach.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-foreground/90">
                <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Not transcribed yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading title="Medium of instruction" icon={BookOpenIcon} />
        <p className="rounded-lg border bg-muted/40 p-4 text-sm text-foreground/90">
          {curriculum.medium_of_instruction}
        </p>
      </section>

      <section className="space-y-3">
        <SectionHeading title="Learning resources" icon={PackageCheckIcon} />
        {(curriculum.learning_resources ?? []).length > 0 ? (
          <ul className="space-y-1.5">
            {curriculum.learning_resources?.map((resource) => (
              <li key={resource} className="flex items-start gap-2 text-sm text-foreground/90">
                <PackageCheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{resource}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Not transcribed yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading title="Weekly allocation of periods" icon={ClockIcon} />
        {curriculum.period_allocation.length > 0 ? (
          <div className="space-y-2">
            {curriculum.period_allocation.map((row) => (
              <div key={row.strand} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.strand}</span>
                  <span className="font-medium">{row.periods} periods</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.periods / maxPeriods) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs font-medium text-muted-foreground">
              {curriculum.period_allocation.reduce(
                (sum, row) => sum + row.periods,
                0,
              )}{" "}
              periods per week
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not transcribed yet.</p>
        )}
        {curriculum.timetable_notes.length > 0 ? (
          <ul className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
            {curriculum.timetable_notes.map((note) => (
              <li key={note} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum — Assessment tab
// ---------------------------------------------------------------

function ThematicAssessmentTab({
  curriculum,
  onOpenTheme,
}: {
  curriculum: MockThematicCurriculum;
  onOpenTheme: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeading title="Approach to assessment" icon={FileTextIcon} />
        <ul className="space-y-2">
          {curriculum.assessment_approach.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-foreground/90">
              <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <SectionHeading title="Per-theme assessment guidelines" icon={ListChecksIcon} />
        {curriculum.themes.filter((theme) => theme.fidelity === "mirrored").length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {curriculum.themes
              .filter((theme) => theme.fidelity === "mirrored")
              .map((theme) => {
                const count = theme.assessment_guidelines.reduce(
                  (sum, group) => sum + group.items.length,
                  0,
                );
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onOpenTheme(theme.id)}
                    className="space-y-2 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{theme.title}</p>
                      <Badge variant="outline">{count} items</Badge>
                    </div>
                    {count > 0 ? (
                      <ul className="space-y-1 border-l-2 border-primary/20 pl-3">
                        {theme.assessment_guidelines
                          .flatMap((group) => group.items)
                          .slice(0, 3)
                          .map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2Icon className="mt-0.5 size-3 shrink-0 text-primary/70" />
                              <span>{item}</span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not specified yet.</p>
                    )}
                  </button>
                );
              })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No per-theme assessment guidelines transcribed yet.
          </p>
        )}
      </section>
    </div>
  );
}

function getThematicCoverage(
  curriculum: MockThematicCurriculum,
): Record<MockCurriculumComponentId, boolean> {
  return {
    intent:
      curriculum.cycles.length > 0 ||
      curriculum.national_aims.length > 0 ||
      curriculum.aims_of_primary_education.length > 0 ||
      curriculum.themes.some((theme) => theme.learning_outcome !== null),
    content:
      curriculum.themes.length > 0 || curriculum.learning_areas.length > 0,
    learning_teaching:
      curriculum.approach.length > 0 ||
      (curriculum.learning_resources?.length ?? 0) > 0 ||
      curriculum.period_allocation.length > 0,
    assessment:
      curriculum.assessment_approach.length > 0 ||
      curriculum.themes.some(
        (theme) =>
          theme.assessment_guidelines.reduce(
            (sum, group) => sum + group.items.length,
            0,
          ) > 0,
      ),
  };
}

// ---------------------------------------------------------------
// Thematic curriculum — Themes tab
// ---------------------------------------------------------------

function ThematicThemeCard({
  theme,
  onOpen,
}: {
  theme: MockThematicTheme;
  onOpen: (id: string) => void;
}) {
  const guidelineCount = theme.assessment_guidelines.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(theme.id)}
      className="w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPinIcon className="size-4 text-primary" />
          <p className="text-sm font-semibold">{theme.title}</p>
        </div>
        <FidelityBadge fidelity={theme.fidelity} />
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{theme.code}</p>
      {theme.learning_outcome ? (
        <p className="mt-2 text-sm text-muted-foreground">{theme.learning_outcome}</p>
      ) : theme.note ? (
        <p className="mt-2 text-xs italic text-muted-foreground/70">{theme.note}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline">{theme.sub_themes.length} sub-themes</Badge>
        <Badge variant="outline">{guidelineCount} assessment items</Badge>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------
// Thematic curriculum — Learning areas tab
// ---------------------------------------------------------------

const LEARNING_AREA_ICONS: Record<string, Icon> = {
  "la-cre": ChurchIcon,
  "la-ire": MoonIcon,
  "la-pe": DumbbellIcon,
};

function LearningAreasTab({
  curriculum,
}: {
  curriculum: MockThematicCurriculum;
}) {
  if (curriculum.learning_areas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not transcribed yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {curriculum.learning_areas.map((area) => {
        const Icon = LEARNING_AREA_ICONS[area.id] ?? BookOpenIcon;
        return (
          <Card key={area.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <CardTitle className="text-base">{area.title}</CardTitle>
                </div>
                <FidelityBadge fidelity={area.fidelity} />
              </div>
              <CardDescription>
                <span className="font-mono text-xs">{area.code}</span>
                <span className="mx-1.5">·</span>
                Standalone learning area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {area.outcome ? (
                <div className="space-y-1">
                  <SectionHeading title="Learning outcome" icon={TargetIcon} />
                  <p className="text-sm text-foreground/90">{area.outcome}</p>
                </div>
              ) : null}
              <div className="space-y-1">
                <SectionHeading title="Organisation" icon={ScrollTextIcon} />
                <p className="text-sm text-foreground/90">{area.organisation}</p>
              </div>
              <ul className="space-y-1.5">
                {area.notes.map((note) => (
                  <li key={note} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// Thematic theme detail — matrix + assessment guidelines
// ---------------------------------------------------------------

const STRAND_COLUMNS: { strand: MockThematicStrandId; label: string }[] = [
  { strand: "mathematics", label: "Mathematics" },
  { strand: "literacy", label: "Literacy" },
  { strand: "english", label: "English (non-medium)" },
  { strand: "creative_performing_arts", label: "Creative Performing Arts" },
  { strand: "life_skills", label: "Life Skills & Values" },
];

function MatrixCell({
  subTheme,
  strand,
}: {
  subTheme: MockThematicSubTheme;
  strand: MockThematicStrandId;
}) {
  const blocks = subTheme.blocks.filter(
    (block) =>
      strand === "life_skills"
        ? block.strand === "life_skills" || block.strand === "values"
        : block.strand === strand,
  );

  if (blocks.length === 0) {
    return <p className="text-xs text-muted-foreground/50">—</p>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div key={`${block.heading ?? block.strand}-${index}`}>
          {block.heading ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {block.heading}
            </p>
          ) : null}
          <ul className="mt-1 space-y-1">
            {block.items.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground/80">
                <span className="mt-[5px] size-1 shrink-0 rounded-full bg-primary/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ThemeMatrix({ theme }: { theme: MockThematicTheme }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thematic matrix</CardTitle>
        <CardDescription>
          Sub-theme/content rows × learning-area strands, as printed in the curriculum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-52 align-top">Sub-theme / content</TableHead>
                {STRAND_COLUMNS.map((column) => (
                  <TableHead key={column.strand} className="align-top">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {theme.sub_themes.map((subTheme) => (
                <TableRow key={subTheme.id} className="align-top">
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        <span className="font-mono text-xs text-muted-foreground">
                          {subTheme.code}
                        </span>{" "}
                        {subTheme.title}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {subTheme.content.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/80"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  {STRAND_COLUMNS.map((column) => (
                    <TableCell key={column.strand} className="align-top">
                      <MatrixCell subTheme={subTheme} strand={column.strand} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Source footnotes: Creative Arts competences are listed separately from Performing Arts
          (line-spaced); Life Skills are listed separately from Values.
        </p>
      </CardContent>
    </Card>
  );
}

function ThemeDetail({
  curriculum,
  theme,
  onBack,
}: {
  curriculum: MockThematicCurriculum;
  theme: MockThematicTheme;
  onBack: () => void;
}) {
  const guidelineCount = theme.assessment_guidelines.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeftIcon />
        Back to themes
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{theme.title}</CardTitle>
            <FidelityBadge fidelity={theme.fidelity} />
            <Badge variant="outline">{theme.sub_themes.length} sub-themes</Badge>
            <Badge variant="outline">{guidelineCount} assessment items</Badge>
          </div>
          <CardDescription>
            <span className="font-mono text-xs">{theme.code}</span>
            <span className="mx-1.5">·</span>
            Part of {curriculum.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
            <TargetIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Expected learning outcome
              </p>
              <p className="mt-1 text-sm text-foreground/90">
                {theme.learning_outcome ?? "Not specified yet."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {theme.fidelity === "mirrored" ? (
        <>
          <ThemeMatrix theme={theme} />

          <Card>
            <CardHeader>
              <CardTitle>Assessment guidelines</CardTitle>
              <CardDescription>
                What can be assessed for {theme.title} — from the closing table of this theme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {theme.assessment_guidelines.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {theme.assessment_guidelines.map((group) => (
                    <div key={group.strand} className="space-y-2">
                      <SectionHeading title={group.strand} icon={ListChecksIcon} />
                      <ul className="space-y-1.5 border-l-2 border-primary/20 pl-4">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not specified yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{theme.note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ThematicCurriculumPreview({
  curriculum,
  onSave,
}: {
  curriculum: MockThematicCurriculum;
  onSave: (identity: ThematicDraftIdentity, entry: ThematicManualEntry) => void;
}) {
  const stats = getThematicStats(curriculum);
  const [editing, setEditing] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const selectedTheme = selectedThemeId
    ? getThemeById(selectedThemeId, curriculum)
    : undefined;

  if (editing) {
    return (
      <ThematicDraftEditor
        curriculum={curriculum}
        onCancel={() => setEditing(false)}
        onSave={(identity, entry) => {
          onSave(identity, entry);
          setEditing(false);
        }}
      />
    );
  }

  if (selectedTheme) {
    return (
      <ThemeDetail
        curriculum={curriculum}
        theme={selectedTheme}
        onBack={() => setSelectedThemeId(null)}
      />
    );
  }

  const coverage = getThematicCoverage(curriculum);
  const coverageCount = Object.values(coverage).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <ThematicDocumentCard
        curriculum={curriculum}
        onEdit={() => setEditing(true)}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Themes" value={stats.themes} icon={MapPinIcon} />
        <Stat label="Sub-themes (weeks)" value={stats.subThemes} icon={ListChecksIcon} />
        <Stat label="Assessment items" value={stats.guidelineItems} icon={CheckCircle2Icon} />
        <Stat label="Standalone areas" value={stats.learningAreas} icon={BookOpenIcon} />
      </div>

      <ComponentCoverage present={coverage} />

      {curriculum.status === "draft" && coverageCount === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            This draft has no content captured yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="mt-2"
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
            Edit manually
          </Button>
        </div>
      ) : null}

      <Tabs defaultValue="intent">
        <TabsList variant="line">
          <TabsTrigger value="intent">Intent</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="teaching">Learning & Teaching</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="intent">
          <ThematicIntentTab curriculum={curriculum} />
        </TabsContent>
        <TabsContent value="content">
          <ThematicContentTab curriculum={curriculum} onOpenTheme={setSelectedThemeId} />
        </TabsContent>
        <TabsContent value="teaching">
          <ThematicLearningTeachingTab curriculum={curriculum} />
        </TabsContent>
        <TabsContent value="assessment">
          <ThematicAssessmentTab curriculum={curriculum} onOpenTheme={setSelectedThemeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------
// Root preview
// ---------------------------------------------------------------

export function CurriculumAdminPreview() {
  const firstTemplate =
    mockNationalTemplates.find((template) => template.status === "published") ??
    mockNationalTemplates[0];
  const defaultThematic = getThematicCurriculum();
  const [mode, setMode] = useState<PreviewMode>("templates");
  const [templateId, setTemplateId] = useState(firstTemplate?.id ?? "");
  const [syllabusId, setSyllabusId] = useState<string | null>(null);
  const [thematicId, setThematicId] = useState(defaultThematic.id);
  const [, setThematicRevision] = useState(0);

  const [onboardingStructureType, setOnboardingStructureType] =
    useState<OnboardingStructureType>("subject");
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const template = getTemplateById(templateId);
  const syllabus = syllabusId ? getSyllabusViewById(syllabusId) : null;
  const syllabi = template ? getSyllabiForTemplate(template.id) : [];
  const thematic = getThematicCurriculumById(thematicId);

  const handleThematicSave = (
    identity: ThematicDraftIdentity,
    entry: ThematicManualEntry,
  ) => {
    const existing = getThematicCurriculumById(thematicId);
    if (!existing) return;
    const updated = applyThematicManualEntry(
      applyThematicDraftIdentity(existing, identity),
      entry,
    );
    const index = mockThematicCurricula.findIndex(
      (item) => item.id === existing.id,
    );
    if (index >= 0) mockThematicCurricula[index] = updated;
    setThematicRevision((revision) => revision + 1);
  };

  return (
    <div className="space-y-6">
      <ModeSwitch mode={mode} onChange={setMode} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside>
          {mode === "thematic" ? (
            <ThematicCurriculumList
              selectedId={thematicId}
              onSelect={setThematicId}
              onRequestNew={() => {
                setOnboardingStructureType("thematic");
                setOnboardingOpen(true);
              }}
            />
          ) : (
            <TemplateList
              selectedId={templateId}
              onSelect={(id) => {
                setTemplateId(id);
                setSyllabusId(null);
              }}
              onRequestNew={() => {
                setOnboardingStructureType("subject");
                setOnboardingOpen(true);
              }}
            />
          )}
        </aside>

        <main className="min-w-0">
          {mode === "thematic" ? (
            thematic ? (
              <ThematicCurriculumPreview
                key={thematic.id}
                curriculum={thematic}
                onSave={handleThematicSave}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select a thematic curriculum document to review its
                    definition.
                  </p>
                </CardContent>
              </Card>
            )
          ) : syllabus && template ? (
            <SyllabusDetail
              syllabus={syllabus}
              template={template}
              onBack={() => setSyllabusId(null)}
            />
          ) : template ? (
            <TemplateDetail
              template={template}
              syllabi={syllabi}
              onOpenSyllabus={setSyllabusId}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a national template to review its definition.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {onboardingOpen && (
        <DocumentOnboardingDialog
          structureType={onboardingStructureType}
          onOpenChange={setOnboardingOpen}
          onCreate={(payload) => {
            if (payload.structureType === "thematic") {
              const draft = createThematicCurriculumDraft({
                level: payload.levels[0] ?? "P1",
                name: payload.officialTitle,
                edition: payload.edition,
                year: payload.year,
                note:
                  payload.entryMode === "manual"
                    ? "New thematic curriculum by super admin — captured manually in the onboarding wizard (no PDF transcription)."
                    : payload.note ??
                      "New thematic curriculum by super admin — PDF not yet transcribed.",
              });
              const created = payload.entry
                ? applyThematicManualEntry(draft, payload.entry)
                : draft;
              mockThematicCurricula.push(created);
              setThematicId(created.id);
            } else {
              const draft = createNationalTemplateDraft({
                name: payload.officialTitle,
                code: payload.code,
                country: payload.country,
                issuer: payload.issuer,
                year: payload.year,
                levels: payload.levels,
              });
              mockNationalTemplates.push(draft);
              setTemplateId(draft.id);
              setSyllabusId(null);
            }
            setOnboardingOpen(false);
          }}
        />
      )}
    </div>
  );
}