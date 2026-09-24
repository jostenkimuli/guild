import {
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  FileTextIcon,
  LinkIcon,
  MapPinIcon,
  PlayCircleIcon,
  VideoIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPublishedCurriculum,
  getTopicById,
  type MockLesson,
  type MockTopic,
} from "@/lib/playground/mock";
import type { Enums } from "@/lib/supabase/database.types";

const ASSESSMENT_LABELS: Record<Enums<"assessment_type">, string> = {
  quiz: "Quiz",
  exercise: "Exercise",
  test: "Test",
  project: "Project",
};

const RESOURCE_LABELS = {
  link: { label: "Link", icon: LinkIcon },
  video: { label: "Video", icon: VideoIcon },
  document: { label: "Document", icon: FileTextIcon },
  text: { label: "Text", icon: BookOpenIcon },
} as const;

function deliveryLabel(delivery: Enums<"lesson_delivery_type">): string {
  return delivery === "scheduled" ? "Scheduled" : "Self-paced";
}

function formatMinutes(minutes: number | null): string | null {
  if (!minutes) return null;
  return minutes % 60 === 0 ? `${minutes / 60} hr` : `${minutes} min`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function OverviewTab({ topic }: { topic: MockTopic }) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <CheckCircle2Icon className="size-4" /> Learning objectives
        </h3>
        <ul className="space-y-2">
          {topic.learning_objectives.map((objective) => (
            <li key={objective.id} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold text-muted-foreground">
                {objective.sequence}
              </span>
              {objective.description}
            </li>
          ))}
        </ul>
      </section>

      {topic.content.length > 0 ? (
        <section className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <BookOpenIcon className="size-4" /> Lesson content
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {topic.content.map((block) => (
              <Card key={block.id} size="sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-sm">{block.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{block.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {topic.teaching_guidance.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Teaching guidance
          </h3>
          <div className="rounded-xl border bg-muted/40 p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {topic.teaching_guidance.map((row) => (
                <li key={row.id} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {row.guidance}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActivitiesTab({ lesson }: { lesson: MockLesson }) {
  if (lesson.activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {lesson.activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {activity.sequence}
          </span>
          <div>
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AssessmentsTab({ lesson }: { lesson: MockLesson }) {
  if (lesson.assessments.length === 0) {
    return <p className="text-sm text-muted-foreground">No assessments yet.</p>;
  }
  return (
    <ul className="divide-y">
      {lesson.assessments.map((assessment) => (
        <li key={assessment.id} className="space-y-1.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{assessment.title}</span>
              <Badge variant="secondary">
                {ASSESSMENT_LABELS[assessment.type]}
              </Badge>
            </div>
            {assessment.due_date ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDaysIcon className="size-3.5" />
                Due {formatDate(assessment.due_date)}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{assessment.description}</p>
        </li>
      ))}
    </ul>
  );
}

function ResourcesTab({ lesson }: { lesson: MockLesson }) {
  if (lesson.resources.length === 0) {
    return <p className="text-sm text-muted-foreground">No resources yet.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lesson.resources.map((resource) => {
        const meta = RESOURCE_LABELS[resource.type];
        const Icon = meta.icon;
        return (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {resource.title}
              </span>
              <span className="block text-xs text-muted-foreground">
                {meta.label} · open ↗
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default function LessonPage() {
  const curriculum = getPublishedCurriculum();
  const topic = getTopicById("t-fdp");
  const lesson = topic?.lessons.find((entry) => entry.id === "ls-fdp-2");

  if (!topic || !lesson) {
    return (
      <p className="text-sm text-muted-foreground">
        Lesson preview not found in mock data.
      </p>
    );
  }

  const scheduled = lesson.delivery_type === "scheduled" && lesson.session;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Lesson</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The lesson viewer layout — objectives, activities, assessments and
          resources built from the same shapes the Sprint 2 schema exposes.
        </p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{deliveryLabel(lesson.delivery_type)}</Badge>
            {formatMinutes(lesson.estimated_duration_minutes) ? (
              <Badge variant="secondary">
                {formatMinutes(lesson.estimated_duration_minutes)}
              </Badge>
            ) : null}
            <Badge variant={lesson.is_published ? "secondary" : "outline"}>
              {lesson.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
          <CardTitle className="text-xl">{lesson.title}</CardTitle>
          <CardDescription>
            {curriculum.name} · Grade 6 · {topic.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {scheduled ? (
            <div className="flex flex-wrap gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-4 text-primary" />
                {formatDate(lesson.session!.scheduled_start)}
              </span>
              <Separator orientation="vertical" className="hidden h-4 sm:block" />
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPinIcon className="size-4 text-primary" />
                {lesson.session!.medium === "physical"
                  ? lesson.session!.location_room ?? "Room TBA"
                  : "Online session"}
              </span>
              {lesson.session!.meeting_url ? (
                <a
                  href={lesson.session!.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <PlayCircleIcon className="size-4" /> Join meeting
                </a>
              ) : null}
            </div>
          ) : null}
          {lesson.video_url ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              <VideoIcon className="size-4 text-primary" />
              Intro video attached —{" "}
              <span className="font-mono text-xs">{lesson.video_url}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">
            Activities ({lesson.activities.length})
          </TabsTrigger>
          <TabsTrigger value="assessments">
            Assessments ({lesson.assessments.length})
          </TabsTrigger>
          <TabsTrigger value="resources">
            Resources ({lesson.resources.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <OverviewTab topic={topic} />
        </TabsContent>
        <TabsContent value="activities" className="pt-4">
          <ActivitiesTab lesson={lesson} />
        </TabsContent>
        <TabsContent value="assessments" className="pt-4">
          <AssessmentsTab lesson={lesson} />
        </TabsContent>
        <TabsContent value="resources" className="pt-4">
          <ResourcesTab lesson={lesson} />
        </TabsContent>
      </Tabs>
    </div>
  );
}