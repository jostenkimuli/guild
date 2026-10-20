"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  RequirementBadge,
  RequirementLegend,
} from "@/components/curriculum/requirement-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  areaStrands,
  TERMS,
  thematicStrands,
  type NationalCurriculum,
  type NationalStrand,
  type NationalSubtheme,
  type NationalTheme,
} from "@/lib/curriculum/national";
import type { RequirementLevel } from "@/lib/curriculum/requirement";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT = 3;

function distinctLevels(competences: { requirement_level: RequirementLevel }[]) {
  return [...new Set(competences.map((c) => c.requirement_level))];
}

export function CurriculumBrowser({
  ecosystemSlug,
  curriculum,
}: {
  ecosystemSlug: string;
  curriculum: NationalCurriculum;
}) {
  const strands = useMemo(() => thematicStrands(curriculum), [curriculum]);
  const areas = useMemo(() => areaStrands(curriculum), [curriculum]);
  const strandById = useMemo(
    () => new Map(curriculum.strands.map((s) => [s.id, s])),
    [curriculum],
  );

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"theme" | "strand">("theme");
  const [themeId, setThemeId] = useState(curriculum.themes[0]?.id ?? "");
  const [subthemeId, setSubthemeId] = useState<string | null>(null);
  const [strandId, setStrandId] = useState(strands[0]?.id ?? "");

  const theme = curriculum.themes.find((t) => t.id === themeId) ?? curriculum.themes[0];
  const subtheme = theme?.subthemes.find((s) => s.id === subthemeId) ?? null;

  const loadedThemes = curriculum.themes.filter((t) =>
    t.subthemes.some((s) => s.competences.length > 0),
  ).length;

  function select(nextTheme: NationalTheme, nextSubtheme: NationalSubtheme | null) {
    setThemeId(nextTheme.id);
    setSubthemeId(nextSubtheme?.id ?? null);
    setView("theme");
    setQuery("");
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const found: {
      theme: NationalTheme;
      subtheme: NationalSubtheme;
      competences: NationalSubtheme["competences"];
    }[] = [];
    for (const t of curriculum.themes) {
      for (const st of t.subthemes) {
        const matching = st.competences.filter((c) =>
          c.description.toLowerCase().includes(q),
        );
        const subthemeMatches =
          st.name.toLowerCase().includes(q) || st.content.toLowerCase().includes(q);
        if (matching.length > 0 || subthemeMatches) {
          found.push({ theme: t, subtheme: st, competences: matching });
        }
      }
    }
    return found;
  }, [curriculum, query]);

  const implementationHref = (t: NationalTheme, st: NationalSubtheme) =>
    `/ecosystem/${ecosystemSlug}/implementation?class=${curriculum.slug}&term=${t.term_no}&week=${st.id}`;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Browse the curriculum</h2>
          <p className="text-sm text-muted-foreground">
            {curriculum.themes.length} themes, {curriculum.themes.reduce((n, t) => n + t.subthemes.length, 0)}{" "}
            sub-themes. Each sub-theme is one teaching week.
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, e.g. count to 5"
          aria-label="Search the curriculum"
          className="md:max-w-xs"
        />
      </div>

      <RequirementLegend />

      {loadedThemes < curriculum.themes.length ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Competences are loaded for {loadedThemes} of {curriculum.themes.length} themes so far.
          The other themes show their outcome and sub-themes only.
        </p>
      ) : null}

      <Tabs defaultValue="themes">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="themes">Themes</TabsTrigger>
          {areas.map((area) => (
            <TabsTrigger key={area.id} value={area.id}>
              {area.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="themes" className="space-y-4 pt-2">
          {query.trim().length >= 2 ? (
            <SearchResults
              query={query}
              results={results}
              strandById={strandById}
              onSelect={select}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">View by</span>
                <div className="inline-flex rounded-lg bg-muted p-[3px]">
                  {(["theme", "strand"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      aria-pressed={view === v}
                      className={cn(
                        "rounded-md px-3 py-1 text-sm font-medium",
                        view === v
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {v === "theme" ? "Theme" : "Learning area"}
                    </button>
                  ))}
                </div>
              </div>

              {view === "theme" && theme ? (
                <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
                  <ThemeTree
                    curriculum={curriculum}
                    themeId={theme.id}
                    subthemeId={subtheme?.id ?? null}
                    onSelect={select}
                  />
                  <div className="min-w-0 space-y-4">
                    <ThemeDetail
                      theme={theme}
                      strands={strands}
                      strandById={strandById}
                      subthemeId={subtheme?.id ?? null}
                      onSelect={select}
                    />
                    {subtheme ? (
                      <SubthemeDetail
                        subtheme={subtheme}
                        strandById={strandById}
                        implementationHref={implementationHref(theme, subtheme)}
                      />
                    ) : null}
                  </div>
                </div>
              ) : (
                <StrandView
                  curriculum={curriculum}
                  strands={strands}
                  strandId={strandId}
                  onStrand={setStrandId}
                  onSelect={select}
                />
              )}
            </>
          )}
        </TabsContent>

        {areas.map((area) => (
          <TabsContent key={area.id} value={area.id} className="pt-2">
            <AreaUnits curriculum={curriculum} area={area} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function ThemeTree({
  curriculum,
  themeId,
  subthemeId,
  onSelect,
}: {
  curriculum: NationalCurriculum;
  themeId: string;
  subthemeId: string | null;
  onSelect: (theme: NationalTheme, subtheme: NationalSubtheme | null) => void;
}) {
  return (
    <nav aria-label="Themes" className="space-y-4 rounded-lg border p-3">
      {TERMS.map((term) => {
        const themes = curriculum.themes.filter((t) => t.term_no === term);
        if (themes.length === 0) return null;
        return (
          <div key={term}>
            <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Term {term}
            </p>
            <ul className="space-y-0.5">
              {themes.map((t) => {
                const open = t.id === themeId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(t, null)}
                      aria-current={open && !subthemeId ? "true" : undefined}
                      className={cn(
                        "w-full rounded-md px-2 py-1.5 text-left text-sm",
                        open ? "bg-secondary font-medium" : "hover:bg-secondary/50",
                      )}
                    >
                      Theme {t.theme_no}: {t.name}
                    </button>
                    {open ? (
                      <ul className="mt-0.5 space-y-0.5 border-l pl-2 ml-3">
                        {t.subthemes.map((st) => (
                          <li key={st.id}>
                            <button
                              type="button"
                              onClick={() => onSelect(t, st)}
                              aria-current={st.id === subthemeId ? "true" : undefined}
                              className={cn(
                                "w-full rounded-md px-2 py-1 text-left text-xs",
                                st.id === subthemeId
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                              )}
                            >
                              {st.code} {st.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function ThemeDetail({
  theme,
  strands,
  strandById,
  subthemeId,
  onSelect,
}: {
  theme: NationalTheme;
  strands: NationalStrand[];
  strandById: Map<string, NationalStrand>;
  subthemeId: string | null;
  onSelect: (theme: NationalTheme, subtheme: NationalSubtheme | null) => void;
}) {
  const hasCompetences = theme.subthemes.some((s) => s.competences.length > 0);
  const guidelineGroups = strands
    .map((strand) => ({
      strand,
      items: theme.guidelines.filter((g) => g.strand_id === strand.id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Term {theme.term_no} · Theme {theme.theme_no}
        </p>
        <h3 className="mt-0.5 text-lg font-semibold">{theme.name}</h3>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Expected learning outcome
        </p>
        <p className="mt-0.5 text-sm">{theme.learning_outcome}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          What a child should be able to do after this theme.
        </p>
      </div>

      {hasCompetences ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-40">Sub-theme</TableHead>
                {strands.map((s) => (
                  <TableHead key={s.id} className="min-w-44">
                    {s.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {theme.subthemes.map((st) => (
                <TableRow
                  key={st.id}
                  className={cn("align-top", st.id === subthemeId && "bg-muted/50")}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onSelect(theme, st)}
                      className="text-left font-medium underline-offset-4 hover:underline"
                    >
                      {st.code} {st.name}
                    </button>
                  </TableCell>
                  {strands.map((strand) => {
                    const items = st.competences.filter((c) => c.strand_id === strand.id);
                    const extra = items.length - PREVIEW_COUNT;
                    return (
                      <TableCell key={strand.id} className="whitespace-normal">
                        {items.length === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <ul className="space-y-1">
                            {items.slice(0, PREVIEW_COUNT).map((c) => (
                              <li key={c.id} className="text-xs">
                                {c.description}
                              </li>
                            ))}
                            {extra > 0 ? (
                              <li>
                                <button
                                  type="button"
                                  onClick={() => onSelect(theme, st)}
                                  className="text-xs text-primary underline-offset-4 hover:underline"
                                >
                                  + {extra} more
                                </button>
                              </li>
                            ) : null}
                          </ul>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border">
          <ul className="divide-y">
            {theme.subthemes.map((st) => (
              <li key={st.id} className="p-3">
                <button
                  type="button"
                  onClick={() => onSelect(theme, st)}
                  className="text-left font-medium underline-offset-4 hover:underline"
                >
                  {st.code} {st.name}
                </button>
                <p className="mt-0.5 text-sm text-muted-foreground">{st.content}</p>
              </li>
            ))}
          </ul>
          <p className="border-t bg-muted/30 p-3 text-xs text-muted-foreground">
            The competences for this theme are not loaded yet.
          </p>
        </div>
      )}

      {guidelineGroups.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-semibold">Assessment guidelines for this theme</h4>
          <p className="text-xs text-muted-foreground">
            Competences that can be assessed, by learning area.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {guidelineGroups.map(({ strand, items }) => (
              <div key={strand.id}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {strandById.get(strand.id)?.name}
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                  {items.map((g) => (
                    <li key={g.id}>{g.description}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubthemeDetail({
  subtheme,
  strandById,
  implementationHref,
}: {
  subtheme: NationalSubtheme;
  strandById: Map<string, NationalStrand>;
  implementationHref: string;
}) {
  const groups = [...strandById.values()]
    .map((strand) => ({
      strand,
      items: subtheme.competences.filter((c) => c.strand_id === strand.id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="rounded-lg border border-primary/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sub-theme {subtheme.code} · one teaching week
          </p>
          <h4 className="text-base font-semibold">{subtheme.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{subtheme.content}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={implementationHref}>Use in Implementation</Link>
        </Button>
      </div>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          The competences for this sub-theme are not loaded yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {groups.map(({ strand, items }) => (
            <div key={strand.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{strand.name}</p>
                {distinctLevels(items).map((level) => (
                  <RequirementBadge key={level} level={level} />
                ))}
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                {items.map((c) => (
                  <li key={c.id}>{c.description}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StrandView({
  curriculum,
  strands,
  strandId,
  onStrand,
  onSelect,
}: {
  curriculum: NationalCurriculum;
  strands: NationalStrand[];
  strandId: string;
  onStrand: (id: string) => void;
  onSelect: (theme: NationalTheme, subtheme: NationalSubtheme | null) => void;
}) {
  const rows = curriculum.themes.flatMap((theme) =>
    theme.subthemes
      .map((st) => ({
        theme,
        st,
        items: st.competences.filter((c) => c.strand_id === strandId),
      }))
      .filter((r) => r.items.length > 0),
  );
  const totalItems = rows.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {strands.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStrand(s.id)}
            aria-pressed={s.id === strandId}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              s.id === strandId
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No competences are loaded for this learning area yet.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {totalItems} competences across {rows.length} weeks. Each week is collapsed by
            default — open one to read it, or use search above to jump straight to a match.
          </p>
          <ul className="space-y-2">
            {rows.map(({ theme, st, items }) => (
              <li key={st.id} className="overflow-hidden rounded-lg border">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                      <span className="text-sm font-medium">
                        Term {theme.term_no} · {st.code} {st.name}
                      </span>
                      {distinctLevels(items).map((level) => (
                        <RequirementBadge key={level} level={level} />
                      ))}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  </summary>
                  <div className="border-t bg-muted/20 px-3 py-2">
                    <ul className="list-disc space-y-0.5 pl-5 text-sm">
                      {items.map((c) => (
                        <li key={c.id}>{c.description}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onSelect(theme, st)}
                      className="mt-2 text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Open this week in Theme view
                    </button>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function SearchResults({
  query,
  results,
  strandById,
  onSelect,
}: {
  query: string;
  results: {
    theme: NationalTheme;
    subtheme: NationalSubtheme;
    competences: NationalSubtheme["competences"];
  }[];
  strandById: Map<string, NationalStrand>;
  onSelect: (theme: NationalTheme, subtheme: NationalSubtheme | null) => void;
}) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing matches &ldquo;{query.trim()}&rdquo;. Only the competences that are loaded can be
        searched.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {results.length} sub-theme{results.length === 1 ? "" : "s"} match &ldquo;{query.trim()}&rdquo;.
      </p>
      <ul className="space-y-3">
        {results.map(({ theme, subtheme, competences }) => (
          <li key={subtheme.id} className="rounded-lg border p-3">
            <button
              type="button"
              onClick={() => onSelect(theme, subtheme)}
              className="text-left text-sm font-medium underline-offset-4 hover:underline"
            >
              Theme {theme.theme_no} · {subtheme.code} {subtheme.name}
            </button>
            {competences.length > 0 ? (
              <ul className="mt-1 space-y-1 text-sm">
                {competences.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">
                      {strandById.get(c.strand_id)?.name}:
                    </span>
                    <span>{c.description}</span>
                    <RequirementBadge level={c.requirement_level} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AreaUnits({
  curriculum,
  area,
}: {
  curriculum: NationalCurriculum;
  area: NationalStrand;
}) {
  const units = curriculum.areaUnits.filter((u) => u.strand_id === area.id);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {area.name} runs on its own weekly schedule, separate from the themes.
      </p>
      {TERMS.map((term) => {
        const termUnits = units.filter((u) => u.term_no === term);
        if (termUnits.length === 0) return null;
        return (
          <div key={term} className="rounded-lg border">
            <p className="border-b bg-muted/30 px-4 py-2 text-sm font-medium">Term {term}</p>
            <ul className="divide-y">
              {termUnits.map((u) => (
                <li key={u.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]">
                  <span className="text-sm text-muted-foreground">{u.weeks_label}</span>
                  <div>
                    <p className="text-sm font-medium">{u.title}</p>
                    {u.learning_outcome ? (
                      <p className="text-sm text-muted-foreground">{u.learning_outcome}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
