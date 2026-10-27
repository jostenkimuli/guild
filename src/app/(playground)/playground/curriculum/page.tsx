import {
  BookOpenIcon,
  CheckCircle2Icon,
  Clock3Icon,
  TargetIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  mockCurricula,
  mockCurriculumEvaluations,
  mockSyllabi,
  type MockCurriculumTree,
  type MockTopic,
} from "@/lib/playground/mock";

function TopicPill({ topic }: { topic: MockTopic }) {
  const publishedLessons = topic.lessons.filter((lesson) =>
    Boolean(lesson.is_published),
  ).length;
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{topic.name}</p>
        {topic.duration_weeks ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock3Icon className="size-3" />
            {topic.duration_weeks}w
          </span>
        ) : null}
      </div>
      {topic.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {topic.description}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{topic.learning_objectives.length} objectives</Badge>
        <Badge variant="outline">
          {topic.lessons.length} lessons
          {topic.lessons.length > 0
            ? ` (${publishedLessons} published)`
            : ""}
        </Badge>
      </div>
    </div>
  );
}

function CurriculumCard({ curriculum }: { curriculum: MockCurriculumTree }) {
  const topicCount = curriculum.grades.reduce(
    (sum, grade) =>
      sum +
      grade.terms.reduce(
        (t, term) => t + term.units.reduce((u, unit) => u + unit.topics.length, 0),
        0,
      ),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{curriculum.name}</CardTitle>
            <Badge
              variant={curriculum.is_published ? "secondary" : "outline"}
            >
              {curriculum.is_published ? "Published" : "Draft"}
            </Badge>
            <Badge variant="secondary">Year {curriculum.year}</Badge>
          </div>
        </div>
        <CardDescription>
          {topicCount} topics across {curriculum.grades.length} grades
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TargetIcon className="size-3.5" /> Curriculum goals
          </h3>
          {curriculum.curriculum_goals.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {curriculum.curriculum_goals.map((goal, index) => (
                <li key={goal.id} className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{goal.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No goals yet.</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          {curriculum.grades.map((grade) => (
            <div key={grade.id} className="space-y-3">
              <h3 className="text-sm font-semibold">{grade.name}</h3>
              {grade.terms.map((term) => (
                <div key={term.id} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{term.name}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {term.units.map((unit) => (
                      <div key={unit.id} className="space-y-2">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          <BookOpenIcon className="size-3.5 text-primary" />
                          {unit.name}
                        </p>
                        <div className="grid gap-2">
                          {unit.topics.map((topic) => (
                            <TopicPill key={topic.id} topic={topic} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CurriculumPage() {
  const syllabus = mockSyllabi[0];
  const syllabusTree = mockCurricula.find(
    (curriculum) => curriculum.id === syllabus?.curriculum_id,
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Curriculum</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The curriculum library structure — goals down to topics and lessons —
          fed entirely from mock data. Matching the shape the space page queries.
        </p>
      </section>

      {mockCurricula.map((curriculum) => (
        <CurriculumCard key={curriculum.id} curriculum={curriculum} />
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Syllabus summary</CardTitle>
            <CardDescription>
              {syllabus?.curricula?.name ?? "No syllabus"}
              {syllabusTree ? ` · ${syllabusTree.grades.length} grades` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syllabus?.grading_policy ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Grading breakdown
                </p>
                {syllabus.grading_policy.grade_breakdown.map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="font-medium">{row.weight_pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${row.weight_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                {syllabus.grading_policy.pass_mark ? (
                  <p className="text-sm text-muted-foreground">
                    Pass mark:{" "}
                    <span className="font-medium text-foreground">
                      {syllabus.grading_policy.pass_mark}%
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
            {syllabus?.required_materials ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Required materials
                </p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {syllabus.required_materials.split("\n").map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {syllabus?.office_hours ? (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Office hours
                  </p>
                  <p className="mt-0.5 text-sm">{syllabus.office_hours}</p>
                </div>
              ) : null}
              {syllabus?.classroom_expectations ? (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Expectations
                  </p>
                  <p className="mt-0.5 text-sm">{syllabus.classroom_expectations}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Curriculum evaluations</CardTitle>
            <CardDescription>
              Periodic achievement-rate snapshots used to tune the value set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mockCurriculumEvaluations.length > 0 ? (
              <ul className="divide-y">
                {mockCurriculumEvaluations.map((evaluation) => (
                  <li
                    key={evaluation.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon
                        className={`size-4 ${
                          evaluation.achievement_rate >= 50
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">{evaluation.period}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${evaluation.achievement_rate}%` }}
                        />
                      </div>
                      <Badge variant="secondary">
                        {evaluation.achievement_rate}%
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No evaluations yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}