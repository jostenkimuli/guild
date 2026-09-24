import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  PaletteIcon,
  BookOpenIcon,
  GraduationCapIcon,
  BlocksIcon,
  ScrollTextIcon,
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
  mockMembers,
  mockSpaces,
  getPublishedCurriculum,
} from "@/lib/playground/mock";

type PreviewDef = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: "ready" | "wip";
};

const PREVIEWS: PreviewDef[] = [
  {
    href: "/playground/primitives",
    title: "Primitives",
    description:
      "Kitchen sink of every shadcn/ui building block in one place to eyeball consistency.",
    icon: BlocksIcon,
    status: "ready",
  },
  {
    href: "/playground/theme",
    title: "Theme",
    description:
      "Live per-ecosystem palette sandbox — tune dominant color, tone and accent against real feature UI.",
    icon: PaletteIcon,
    status: "ready",
  },
  {
    href: "/playground/curriculum",
    title: "Curriculum",
    description:
      "The curriculum library (goals → grades → terms → units → topics) rendered from mock data.",
    icon: BookOpenIcon,
    status: "ready",
  },
  {
    href: "/playground/curriculum-admin",
    title: "Curriculum admin",
    description:
      "Cycle 1 super-admin view: national templates, subject syllabi, learning outcomes and indicators.",
    icon: ScrollTextIcon,
    status: "ready",
  },
  {
    href: "/playground/lesson",
    title: "Lesson",
    description:
      "The lesson viewer: objectives, content, activities, assessments and resources from mock data.",
    icon: GraduationCapIcon,
    status: "ready",
  },
];

export default function PlaygroundHubPage() {
  const curriculum = getPublishedCurriculum();
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
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          UI previews
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fine-tune feature UI here before wiring it into the app. Every preview
          renders the real components fed by the mock-data layer in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            src/lib/playground/mock.ts
          </code>
          — swap mock for a server query when the UI is approved.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {PREVIEWS.map((preview) => {
          const Icon = preview.icon;
          return (
            <Card key={preview.href} className="transition-colors hover:ring-foreground/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-primary" />
                  <Badge variant={preview.status === "ready" ? "secondary" : "outline"}>
                    {preview.status === "ready" ? "ready" : "wip"}
                  </Badge>
                </div>
                <CardTitle className="pt-2">{preview.title}</CardTitle>
                <CardDescription>{preview.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild variant="outline" size="sm">
                  <Link href={preview.href}>Open preview</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent>
            <p className="text-2xl font-semibold">{mockSpaces.length}</p>
            <p className="text-sm text-muted-foreground">mock spaces</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-2xl font-semibold">{curriculum.grades.length}</p>
            <p className="text-sm text-muted-foreground">curricula with {topicCount} topics</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-2xl font-semibold">{mockMembers.length}</p>
            <p className="text-sm text-muted-foreground">mock members</p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        <h3 className="mb-1 font-medium text-foreground">Adding a preview</h3>
        <p>
          1. Add entities to{" "}
          <code className="font-mono text-xs">src/lib/playground/mock.ts</code>, 2. Build the UI
          with real components under{" "}
          <code className="font-mono text-xs">/playground/&lt;name&gt;</code>, 3. Link it from this
          hub and the layout nav.
        </p>
      </section>
    </div>
  );
}