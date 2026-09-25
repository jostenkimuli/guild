import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { ClassSelector } from "@/components/curriculum/class-selector";
import {
  ImplementationChain,
  SummaryCards,
  type ChainStep,
  type SummaryCard,
} from "@/components/implementation/overview";
import { SchoolDecisions } from "@/components/implementation/school-decisions";
import { TermPlan } from "@/components/implementation/term-plan";
import { TimetableEditor } from "@/components/implementation/timetable-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DECISION_KEYS } from "@/lib/curriculum/decisions";
import { loadSchoolImplementation } from "@/lib/curriculum/implementation";
import {
  listNationalCurricula,
  loadNationalCurriculum,
  TERMS,
  termWeeks,
} from "@/lib/curriculum/national";
import { validateTimetable } from "@/lib/curriculum/timetable-rules";
import { isSchoolType } from "@/lib/ecosystems";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const TABS = ["term-plan", "timetable", "decisions"] as const;
type TabValue = (typeof TABS)[number];

export default async function ImplementationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ class?: string; term?: string; tab?: string; week?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ecosystem } = await supabase
    .from("ecosystems")
    .select("id, slug, name, type")
    .eq("slug", slug)
    .maybeSingle();
  if (!ecosystem) notFound();
  if (!isSchoolType(ecosystem.type)) redirect(`/ecosystem/${slug}`);

  const header = (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Implementation</h2>
      <p className="text-sm text-muted-foreground">
        Turn the national curriculum into a plan your teachers can run: who teaches each week,
        which timetable slots, and the choices the curriculum leaves to your school.
      </p>
    </div>
  );

  const curricula = await listNationalCurricula(supabase, ecosystem.type);
  const selected = curricula.find((c) => c.slug === query.class) ?? curricula[0];
  const curriculum = selected ? await loadNationalCurriculum(supabase, selected.id) : null;

  if (!selected || !curriculum) {
    return (
      <section className="space-y-6">
        {header}
        <ConsolePanel title="No national curriculum loaded yet">
          <EmptyState>
            There is no national curriculum for this type of school yet, so there is nothing to
            implement.
          </EmptyState>
        </ConsolePanel>
      </section>
    );
  }

  const school = await loadSchoolImplementation(supabase, ecosystem.id, curriculum);

  if (!school.adoption) {
    return (
      <section className="space-y-6">
        {header}
        <ConsolePanel title="Adopt the national curriculum first">
          <div className="space-y-3">
            <EmptyState>
              Your school has not adopted {curriculum.title} yet. Adopt it first, then plan how
              your school will teach it.
            </EmptyState>
            <Button asChild>
              <Link href={`/ecosystem/${slug}/curriculum?class=${curriculum.slug}`}>
                Go to National Curriculum
              </Link>
            </Button>
          </div>
        </ConsolePanel>
      </section>
    );
  }

  const termNo = (TERMS as readonly number[]).includes(Number(query.term))
    ? Number(query.term)
    : 1;
  const tab: TabValue = (TABS as readonly string[]).includes(query.tab ?? "")
    ? (query.tab as TabValue)
    : "term-plan";

  const weeks = termWeeks(curriculum, termNo);
  const weekPlans = weeks.map((w) => school.weeks[w.subtheme.id]);
  const readyWeeks = weekPlans.filter((w) => w?.status === "ready" || w?.status === "approved").length;
  const draftWeeks = weekPlans.filter((w) => w?.status === "draft").length;
  const teachersAssigned = weekPlans.filter((w) => w?.teacherId).length;

  const timetable = validateTimetable(curriculum.allocations, school.timetable?.slots ?? []);
  const timetablePublished = Boolean(school.timetable?.publishedAt);
  const decided = DECISION_KEYS.filter((k) => school.decisions[k]).length;

  const href = (next: { tab?: TabValue; term?: number }) =>
    `/ecosystem/${slug}/implementation?class=${curriculum.slug}&term=${next.term ?? termNo}&tab=${next.tab ?? tab}`;

  const steps: ChainStep[] = [
    {
      title: "National curriculum",
      detail: `Adopted ${school.adoption.adoptedAt.slice(0, 10)}`,
      state: "done",
    },
    {
      title: "Term plan",
      detail: `Term ${termNo}: ${readyWeeks} of ${weeks.length} weeks ready`,
      state: readyWeeks === weeks.length ? "done" : "active",
    },
    {
      title: "Timetable",
      detail: timetablePublished ? "Published" : `${timetable.totalPlaced} of ${timetable.totalRequired} periods placed`,
      state: timetablePublished ? "done" : "active",
    },
    {
      title: "School decisions",
      detail: `${decided} of ${DECISION_KEYS.length} decided`,
      state: decided === DECISION_KEYS.length ? "done" : "active",
    },
    { title: "Lesson plans", detail: "Coming later", state: "later" },
    { title: "Classroom activities", detail: "Coming later", state: "later" },
    { title: "Learner assessment", detail: "Coming later", state: "later" },
  ];

  const cards: SummaryCard[] = [
    {
      title: "Curriculum coverage",
      value: `${readyWeeks} of ${weeks.length}`,
      hint: `weeks of Term ${termNo} planned and ready${draftWeeks ? `, ${draftWeeks} in draft` : ""}`,
      href: href({ tab: "term-plan" }),
      ok: readyWeeks === weeks.length,
    },
    {
      title: "Timetable",
      value: `${timetable.totalPlaced} of ${timetable.totalRequired}`,
      hint: timetablePublished ? "required periods placed, published" : "required periods placed each week",
      href: href({ tab: "timetable" }),
      ok: timetable.canPublish && timetablePublished,
    },
    {
      title: "Teachers",
      value: `${teachersAssigned} of ${weeks.length}`,
      hint: `weeks of Term ${termNo} have a teacher`,
      href: href({ tab: "term-plan" }),
      ok: teachersAssigned === weeks.length,
    },
  ];

  return (
    <section className="space-y-6">
      {header}

      <div className="space-y-3">
        <ClassSelector
          curricula={curricula}
          selectedSlug={curriculum.slug}
          hrefFor={(c) => `/ecosystem/${slug}/implementation?class=${c.slug}`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Term</span>
          {TERMS.map((t) => (
            <Link
              key={t}
              href={href({ term: t, tab: "term-plan" })}
              aria-current={t === termNo ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                t === termNo
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Term {t}
            </Link>
          ))}
          <Link
            href={`/ecosystem/${slug}/curriculum?class=${curriculum.slug}`}
            className="ml-auto text-sm underline underline-offset-4"
          >
            {curriculum.class_level}, {curriculum.edition.toLowerCase()} (National Curriculum)
          </Link>
        </div>
      </div>

      <ImplementationChain steps={steps} />
      <SummaryCards cards={cards} />
      <p className="text-xs text-muted-foreground">
        These numbers show how complete your plan is. They do not show what happens in classrooms.
      </p>

      <Tabs key={`${tab}:${query.week ?? ""}`} defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="term-plan">Term plan</TabsTrigger>
          <TabsTrigger value="timetable">Weekly timetable</TabsTrigger>
          <TabsTrigger value="decisions">School decisions</TabsTrigger>
        </TabsList>
        <TabsContent value="term-plan" className="pt-2">
          <TermPlan
            ecosystemId={ecosystem.id}
            curriculum={curriculum}
            term={termNo}
            weeks={school.weeks}
            teachers={school.teachers}
            initialSubthemeId={query.week ?? null}
          />
        </TabsContent>
        <TabsContent value="timetable" className="pt-2">
          <TimetableEditor
            ecosystemId={ecosystem.id}
            curriculum={curriculum}
            saved={school.timetable}
          />
        </TabsContent>
        <TabsContent value="decisions" className="pt-2">
          <SchoolDecisions
            ecosystemId={ecosystem.id}
            curriculumId={curriculum.id}
            decisions={school.decisions}
            rules={curriculum.rules}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
