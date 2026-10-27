"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  ClipboardCheckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DeltaChip,
  GenderBars,
  HBar,
  RingGauge,
  SplitBar,
} from "@/components/playground/curriculum-charts";
import {
  mockAoI,
  mockAssessmentLiteracy,
  mockCoCurricularUtilization,
  mockCpd,
  mockCpdModes,
  mockDashboardContext,
  mockDelivery,
  mockDigitalAdoption,
  mockGenderTrends,
  mockGenericSkills,
  mockInfrastructure,
  mockLifeSkillsIntegration,
  mockLocalMaterials,
  mockPillars,
  mockProjectWork,
  mockRemediation,
  mockSen,
  mockTextbookRatios,
  mockUnebReadiness,
  overallReadiness,
  standardFramework,
  statusFor,
  type PillarStatus,
  type TermId,
  type TermPair,
} from "@/lib/playground/curriculum-dashboard";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<PillarStatus, string> = {
  on_track: "On track",
  attention: "Needs attention",
  at_risk: "At risk",
};

const STATUS_TONE: Record<PillarStatus, "emerald" | "amber" | "red"> = {
  on_track: "emerald",
  attention: "amber",
  at_risk: "red",
};

function pick(pair: TermPair, term: TermId): number {
  return pair[term];
}

function StatusPill({ status }: { status: PillarStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "on_track" && "border-emerald-500/30 text-emerald-600",
        status === "attention" && "border-amber-500/30 text-amber-600",
        status === "at_risk" && "border-red-500/30 text-destructive",
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

// ---------------------------------------------------------------
// Summary checklist
// ---------------------------------------------------------------

function PillarCard({
  pillar,
  term,
}: {
  pillar: (typeof mockPillars)[number];
  term: TermId;
}) {
  const status = statusFor(pillar.readiness[term]);
  return (
    <Card>
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{pillar.label}</CardTitle>
          <StatusPill status={status} />
        </div>
        <CardDescription className="text-xs">{pillar.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex items-center gap-3">
          <RingGauge value={pillar.readiness[term]} size={96} stroke={8} />
          <div className="flex-1 space-y-2">
            {pillar.items.map((item) => (
              <div key={item.label}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value[term]}%</span>
                </div>
                <HBar
                  value={item.value[term]}
                  tone={STATUS_TONE[statusFor(item.value[term])]}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------
// A. Continuous assessment
// ---------------------------------------------------------------

function AssessmentPanel({ term }: { term: TermId }) {
  const readiness = mockUnebReadiness;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">AoI submission &amp; scoring</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right">Timely</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAoI.map((row) => (
                  <TableRow key={row.subject}>
                    <TableCell className="max-w-[220px] truncate text-sm">
                      {row.subject}
                    </TableCell>
                    <TableCell className="text-right">
                      {pick(row.submitted, term)}%{" "}
                      <DeltaChip t1={row.submitted.t1} t2={row.submitted.t2} />
                    </TableCell>
                    <TableCell className="text-right">
                      {pick(row.scoring_accuracy, term)}%{" "}
                      <DeltaChip
                        t1={row.scoring_accuracy.t1}
                        t2={row.scoring_accuracy.t2}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {pick(row.timely, term)}%{" "}
                      <DeltaChip t1={row.timely.t1} t2={row.timely.t2} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Project work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-2xl font-bold">{pick(mockProjectWork.individual_projects, term)}</p>
                <p className="text-xs text-muted-foreground">
                  Individual projects <DeltaChip t1={mockProjectWork.individual_projects.t1} t2={mockProjectWork.individual_projects.t2} />
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-2xl font-bold">{pick(mockProjectWork.group_projects, term)}</p>
                <p className="text-xs text-muted-foreground">
                  Group projects <DeltaChip t1={mockProjectWork.group_projects.t1} t2={mockProjectWork.group_projects.t2} />
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {mockProjectWork.rubric_bins.map((bin) => (
                <div key={bin.scale}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Rubric level {bin.scale}
                      {bin.scale === 1 ? " · basic" : bin.scale === 3 ? " · advanced" : ""}
                    </span>
                    <DeltaChip t1={bin.share.t1} t2={bin.share.t2} />
                  </div>
                  <HBar
                    value={pick(bin.share, term)}
                    tone={bin.scale === 1 ? "red" : bin.scale === 2 ? "amber" : "emerald"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Certification-portal readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Complete, error-free continuous-assessment records ready before the
              statutory deadline.
            </p>
            <div>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Record completeness</span>
                <DeltaChip t1={readiness.completeness.t1} t2={readiness.completeness.t2} />
              </div>
              <HBar value={pick(readiness.completeness, term)} />
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Error-free records</span>
                <DeltaChip t1={readiness.error_free.t1} t2={readiness.error_free.t2} />
              </div>
              <HBar value={pick(readiness.error_free, term)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Generic skill acquisition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {mockGenericSkills.map((skill) => (
            <div key={skill.id}>
              <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                <span>{skill.label}</span>
                <span className="flex items-center gap-2">
                  <DeltaChip t1={skill.achieved.t1} t2={skill.achieved.t2} />
                  <span className="font-medium">
                    {pick(skill.achieved, term)}% · target {skill.target}%
                  </span>
                </span>
              </div>
              <HBar value={pick(skill.achieved, term)} target={skill.target} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
// B. Pedagogy & delivery
// ---------------------------------------------------------------

function PedagogyPanel({ term }: { term: TermId }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">
            Delivery time &amp; syllabus coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Facilitation vs learner engagement</TableHead>
                <TableHead className="w-[180px]">Scheme coverage</TableHead>
                <TableHead>Sequence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDelivery.map((row) => (
                <TableRow key={row.subject}>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {row.subject}
                  </TableCell>
                  <TableCell>
                    <SplitBar
                      segments={[
                        {
                          label: "Lecture",
                          value: pick(row.lecture_min, term),
                          className: "bg-foreground/30",
                        },
                        {
                          label: "Engagement",
                          value: pick(row.engagement_min, term),
                          className: "bg-primary",
                        },
                      ]}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <HBar value={pick(row.coverage_pct, term)} className="flex-1" />
                      <span className="w-14 text-right text-xs">
                        {pick(row.coverage_pct, term)}%
                      </span>
                      <DeltaChip t1={row.coverage_pct.t1} t2={row.coverage_pct.t2} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        row.sequence_compliant
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-amber-500/30 text-amber-600"
                      }
                    >
                      {row.sequence_compliant ? "NCDC-aligned" : "Gap found"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Life skills &amp; values integration</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">% of lessons weaving values</span>
              <DeltaChip t1={mockLifeSkillsIntegration.t1} t2={mockLifeSkillsIntegration.t2} />
            </div>
            <HBar value={pick(mockLifeSkillsIntegration, term)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Patriotism, integrity, social responsibility and equity across
              lesson plans and co-curricular programmes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Co-curricular afternoon block</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Utilization</span>
              <DeltaChip
                t1={mockCoCurricularUtilization.t1}
                t2={mockCoCurricularUtilization.t2}
              />
            </div>
            <HBar value={pick(mockCoCurricularUtilization, term)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Mandatory afternoon blocks spent on student-led innovation, clubs
              and practical skill development.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// C. Teacher capacity
// ---------------------------------------------------------------

function TeacherPanel({ term, targetHours }: { term: TermId; targetHours: number }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">
            CPD hours <span className="text-xs font-normal text-muted-foreground">· annual target {targetHours}h</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {mockCpd.map((teacher) => (
            <div key={teacher.name}>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span>{teacher.name}</span>
                <span className="flex items-center gap-2">
                  <DeltaChip t1={teacher.hours.t1} t2={teacher.hours.t2} />
                  <span className="font-medium">
                    {pick(teacher.hours, term)}h of {targetHours}
                  </span>
                </span>
              </div>
              <HBar value={Math.min(100, (pick(teacher.hours, term) / targetHours) * 100)} />
            </div>
          ))}
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Delivery mode (staff aggregate)
            </p>
            <div className="space-y-2">
              {mockCpdModes.map((mode) => (
                <div key={mode.mode}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{mode.mode}</span>
                    <span className="flex items-center gap-2">
                      <DeltaChip t1={mode.hours.t1} t2={mode.hours.t2} />
                      <span className="font-medium">{pick(mode.hours, term)}h</span>
                    </span>
                  </div>
                  <HBar value={Math.min(100, pick(mode.hours, term) / 2)} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Assessment literacy</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Moderation audit accuracy</span>
              <DeltaChip t1={mockAssessmentLiteracy.t1} t2={mockAssessmentLiteracy.t2} />
            </div>
            <HBar value={pick(mockAssessmentLiteracy, term)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Consistent scoring of open-ended scenarios, projects and AoIs
              across internal moderation audits.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Digital adoption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Teachers creating ICT lessons</span>
                <span className="flex items-center gap-2">
                  <DeltaChip
                    t1={mockDigitalAdoption.ict_lessons_pct.t1}
                    t2={mockDigitalAdoption.ict_lessons_pct.t2}
                  />
                  <span className="font-medium">{pick(mockDigitalAdoption.ict_lessons_pct, term)}%</span>
                </span>
              </div>
              <HBar value={pick(mockDigitalAdoption.ict_lessons_pct, term)} tone="primary" />
            </div>
            <div>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Using digital marksheets</span>
                <span className="flex items-center gap-2">
                  <DeltaChip
                    t1={mockDigitalAdoption.digital_marksheets_pct.t1}
                    t2={mockDigitalAdoption.digital_marksheets_pct.t2}
                  />
                  <span className="font-medium">{pick(mockDigitalAdoption.digital_marksheets_pct, term)}%</span>
                </span>
              </div>
              <HBar value={pick(mockDigitalAdoption.digital_marksheets_pct, term)} tone="emerald" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// D. Resources & infrastructure
// ---------------------------------------------------------------

function ResourcesPanel({ term, textbookTarget }: { term: TermId; textbookTarget: number }) {
  const maxRatio = textbookTarget * 2;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">
              Learner-to-textbook ratio <span className="text-xs font-normal text-muted-foreground">· target {textbookTarget}:1</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {mockTextbookRatios.map((row) => {
              const value = pick(row.learners_per_book, term);
              const progress =
                value >= maxRatio
                  ? 0
                  : Math.min(100, Math.max(0, ((maxRatio - value) / (maxRatio - textbookTarget)) * 100));
              return (
                <div key={row.subject}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span>{row.subject}</span>
                    <span className="flex items-center gap-2">
                      <DeltaChip
                        t1={row.learners_per_book.t1}
                        t2={row.learners_per_book.t2}
                      />
                      <span className="font-medium">{value.toFixed(1)}:1</span>
                    </span>
                  </div>
                  <HBar value={progress} tone={progress >= 80 ? "emerald" : progress >= 50 ? "amber" : "red"} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Practical infrastructure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {mockInfrastructure.map((item) => (
              <div key={item.name}>
                <div className="mb-0.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    {item.name}
                    <Badge
                      variant="outline"
                      className={
                        item.available
                          ? "border-emerald-500/30 text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
                      {item.available ? "Available" : "Planned"}
                    </Badge>
                  </span>
                  <span className="flex items-center gap-2">
                    <DeltaChip t1={item.functional_pct.t1} t2={item.functional_pct.t2} />
                    <span className="font-medium">{pick(item.functional_pct, term)}%</span>
                  </span>
                </div>
                <HBar value={pick(item.functional_pct, term)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Local material sourcing</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">{pick(mockLocalMaterials, term)}</p>
            <DeltaChip t1={mockLocalMaterials.t1} t2={mockLocalMaterials.t2} />
            <p className="text-xs text-muted-foreground">
              low-cost and locally improvised items inventoried for science
              experiments and practical arts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
// E. Inclusive education
// ---------------------------------------------------------------

function InclusivePanel({ term }: { term: TermId }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">SEN profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <p className="text-2xl font-bold">{mockSen.identified}</p>
          <p className="text-xs text-muted-foreground">
            learners identified with learning differences
          </p>
          <div>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Adaptation plans in place</span>
              <DeltaChip t1={mockSen.adapted_plans.t1} t2={mockSen.adapted_plans.t2} />
            </div>
            <HBar value={pick(mockSen.adapted_plans, term)} />
          </div>
          <div>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Coverage</span>
              <DeltaChip t1={mockSen.coverage_pct.t1} t2={mockSen.coverage_pct.t2} />
            </div>
            <HBar value={pick(mockSen.coverage_pct, term)} tone="emerald" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Remediation &amp; intervention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold">{mockRemediation.level1_count}</p>
              <p className="text-xs text-muted-foreground">learners at level 1</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{mockRemediation.sessions}</p>
              <p className="text-xs text-muted-foreground">catch-up sessions</p>
            </div>
          </div>
          <div>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Improvement rate</span>
              <DeltaChip t1={mockRemediation.improved_pct.t1} t2={mockRemediation.improved_pct.t2} />
            </div>
            <HBar value={pick(mockRemediation.improved_pct, term)} tone="amber" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Gender-disaggregated trends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {mockGenderTrends.map((row) => (
            <div key={row.domain}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{row.domain}</span>
                <DeltaChip t1={row.female.t1} t2={row.female.t2} />
              </div>
              <GenderBars female={pick(row.female, term)} male={pick(row.male, term)} />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Progression and project participation in STEM and ICT fields.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------

export function SchoolCurriculumDashboard() {
  const context = mockDashboardContext;
  const [term, setTerm] = useState<TermId>("t2");
  const [standardCode, setStandardCode] = useState(
    context.followed_standard_codes[0] ?? "NCDC-UPE-PRI",
  );
  const [tab, setTab] = useState("assessment");

  const framework = useMemo(
    () => standardFramework(standardCode),
    [standardCode],
  );
  const overall = useMemo(() => overallReadiness(mockPillars, term), [term]);

  return (
    <div className="space-y-6">
      {/* Context strip */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {context.school_name}
              </h2>
              <Badge variant="secondary">School admin</Badge>
              <Badge variant="outline">{framework.certification_body} compliance</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              National curriculum implementation through {framework.issuer} ·{" "}
              {context.term_year}
            </p>
            <p className="text-xs text-muted-foreground">
              Continuous assessment counts {framework.ca_contribution_pct}% of the
              final certification. AoIs are scored on a {framework.aoi_scale} scale;
              records upload to the {framework.portal_name} before{" "}
              {framework.statutory_deadline}.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground">Followed standard</label>
            <select
              value={standardCode}
              onChange={(event) => setStandardCode(event.target.value)}
              className={selectClass}
            >
              {context.followed_standard_codes.map((code) => (
                <option key={code} value={code}>
                  {standardFramework(code).country} · {code}
                </option>
              ))}
            </select>
            <div className="ml-2 inline-flex rounded-lg border">
              {context.terms.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTerm(item.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    term === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Students", value: context.stats.students, icon: UsersIcon },
          { label: "Teachers", value: context.stats.teachers, icon: ClipboardCheckIcon },
          { label: "Classes", value: context.stats.classes, icon: WrenchIcon },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary checklist */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">
              National curriculum implementation summary
            </h3>
            <Badge variant="secondary">Termly snapshot</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpRightIcon className="size-4" />
            Highlighted gaps need leadership attention
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <RingGauge value={overall} label="Overall" sublabel={framework.country} />
            </CardContent>
          </Card>
          {mockPillars.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} term={term} />
          ))}
        </div>
      </div>

      {/* Metric areas */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="assessment">A · Continuous assessment</TabsTrigger>
          <TabsTrigger value="pedagogy">B · Pedagogy &amp; delivery</TabsTrigger>
          <TabsTrigger value="teacher">C · Teacher capacity</TabsTrigger>
          <TabsTrigger value="resources">D · Resources</TabsTrigger>
          <TabsTrigger value="inclusive">E · Inclusive education</TabsTrigger>
        </TabsList>
        <TabsContent value="assessment">
          <AssessmentPanel term={term} />
        </TabsContent>
        <TabsContent value="pedagogy">
          <PedagogyPanel term={term} />
        </TabsContent>
        <TabsContent value="teacher">
          <TeacherPanel term={term} targetHours={framework.cpd_target_hours} />
        </TabsContent>
        <TabsContent value="resources">
          <ResourcesPanel term={term} textbookTarget={framework.textbook_target} />
        </TabsContent>
        <TabsContent value="inclusive">
          <InclusivePanel term={term} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Mock snapshot for UI review · termly metric tables will replace this data
        when wired to the school&apos;s subscribed standards.
      </p>
    </div>
  );
}