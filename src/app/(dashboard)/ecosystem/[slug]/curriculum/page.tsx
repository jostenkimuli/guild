import { notFound, redirect } from "next/navigation";

import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { AdoptionCard } from "@/components/curriculum/adoption-card";
import { BigPicture } from "@/components/curriculum/big-picture";
import { ClassSelector } from "@/components/curriculum/class-selector";
import { CurriculumBrowser } from "@/components/curriculum/curriculum-browser";
import { WeeklyAllocation } from "@/components/curriculum/weekly-allocation";
import {
  listNationalCurricula,
  loadNationalCurriculum,
  requiredPeriods,
} from "@/lib/curriculum/national";
import { ecosystemDisplayName, isSchoolType } from "@/lib/ecosystems";
import { createClient } from "@/lib/supabase/server";

export default async function NationalCurriculumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ class?: string }>;
}) {
  const { slug } = await params;
  const { class: classSlug } = await searchParams;

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

  const curricula = await listNationalCurricula(supabase, ecosystem.type);
  const selected = curricula.find((c) => c.slug === classSlug) ?? curricula[0];
  const curriculum = selected ? await loadNationalCurriculum(supabase, selected.id) : null;

  const header = (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">National Curriculum</h2>
      <p className="text-sm text-muted-foreground">
        The official requirements your school follows. You can&apos;t edit this page. Your
        school&apos;s own plans are under Implementation.
      </p>
    </div>
  );

  if (!selected || !curriculum) {
    return (
      <section className="space-y-6">
        {header}
        <ConsolePanel title="No national curriculum loaded yet">
          <EmptyState>
            There is no national curriculum for this type of school yet. When one is loaded it
            will appear here.
          </EmptyState>
        </ConsolePanel>
      </section>
    );
  }

  const { data: adoption } = await supabase
    .from("school_curriculum_adoptions")
    .select("adopted_at, notify_on_change")
    .eq("ecosystem_id", ecosystem.id)
    .eq("national_curriculum_id", curriculum.id)
    .maybeSingle();

  return (
    <section className="space-y-6">
      {header}

      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">{curriculum.cycle_label}</span>
        </p>
        <ClassSelector
          curricula={curricula}
          selectedSlug={curriculum.slug}
          hrefFor={(c) => `/ecosystem/${slug}/curriculum?class=${c.slug}`}
        />
      </div>

      <AdoptionCard
        ecosystemId={ecosystem.id}
        ecosystemSlug={ecosystem.slug}
        schoolName={ecosystemDisplayName(ecosystem)}
        curriculum={{
          id: curriculum.id,
          slug: curriculum.slug,
          title: curriculum.title,
          authority: curriculum.authority,
          edition: curriculum.edition,
          sourceUrl: curriculum.source_url,
        }}
        adoption={
          adoption
            ? {
                adoptedOn: adoption.adopted_at.slice(0, 10),
                notifyOnChange: adoption.notify_on_change,
              }
            : null
        }
      />

      <BigPicture aims={curriculum.aims} />

      <WeeklyAllocation
        allocations={curriculum.allocations}
        rules={curriculum.rules}
        total={requiredPeriods(curriculum)}
      />

      <CurriculumBrowser ecosystemSlug={ecosystem.slug} curriculum={curriculum} />
    </section>
  );
}
