"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { deleteNode } from "@/app/actions/national-curriculum-admin";
import { DeleteButton } from "@/components/admin-curriculum/delete-button";
import {
  GuidelineDialog,
  NodeDialog,
} from "@/components/admin-curriculum/entity-dialogs";
import { RequirementBadge } from "@/components/curriculum/requirement-badge";
import { Button } from "@/components/ui/button";
import { thematicStrands, type NationalCurriculum, type NationalStrand, type NationalSubtheme, type NationalTheme } from "@/lib/curriculum/national";
import { cn } from "@/lib/utils";

export function TreeTab({ curriculum }: { curriculum: NationalCurriculum }) {
  const strands = thematicStrands(curriculum);
  const strandById = new Map(curriculum.strands.map((s) => [s.id, s]));
  const [themeId, setThemeId] = useState(curriculum.themes[0]?.id ?? null);
  const [subthemeId, setSubthemeId] = useState<string | null>(null);

  const theme = curriculum.themes.find((t) => t.id === themeId) ?? null;
  const subtheme = theme?.subthemes.find((s) => s.id === subthemeId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <nav className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Themes</p>
          <NodeDialog
            curriculumId={curriculum.id}
            nodeType="theme"
            strands={strands}
            defaults={{ themeNo: (curriculum.themes.at(-1)?.theme_no ?? 0) + 1, termNo: 1 }}
            trigger={
              <Button size="sm" variant="ghost" className="h-7 px-2">
                <PlusIcon className="size-3.5" />
              </Button>
            }
          />
        </div>
        <ul className="space-y-0.5">
          {curriculum.themes.map((t) => {
            const open = t.id === themeId;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setThemeId(t.id);
                    setSubthemeId(null);
                  }}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-sm",
                    open ? "bg-secondary font-medium" : "hover:bg-secondary/50",
                  )}
                >
                  {t.theme_no}. {t.name}
                </button>
                {open ? (
                  <ul className="mt-0.5 ml-3 space-y-0.5 border-l pl-2">
                    {t.subthemes.map((st) => (
                      <li key={st.id}>
                        <button
                          type="button"
                          onClick={() => setSubthemeId(st.id)}
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
                    <li>
                      <NodeDialog
                        curriculumId={curriculum.id}
                        nodeType="sub_theme"
                        parentId={t.id}
                        strands={strands}
                        defaults={{ position: t.subthemes.length + 1, code: `${t.theme_no}.${t.subthemes.length + 1}` }}
                        trigger={
                          <button type="button" className="mt-0.5 flex items-center gap-1 px-2 py-1 text-xs text-primary">
                            <PlusIcon className="size-3" /> Add sub-theme
                          </button>
                        }
                      />
                    </li>
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 space-y-4">
        {theme ? (
          <ThemeDetail curriculum={curriculum} theme={theme} strands={strands} strandById={strandById} />
        ) : (
          <p className="text-sm text-muted-foreground">Add a theme to get started.</p>
        )}
        {subtheme && theme ? (
          <SubthemeDetail curriculum={curriculum} theme={theme} subtheme={subtheme} strands={strands} />
        ) : null}
      </div>
    </div>
  );
}

function ThemeDetail({
  curriculum,
  theme,
  strands,
  strandById,
}: {
  curriculum: NationalCurriculum;
  theme: NationalTheme;
  strands: NationalStrand[];
  strandById: Map<string, NationalStrand>;
}) {
  const guidelineGroups = strands
    .map((strand) => ({ strand, items: theme.guidelines.filter((g) => g.strand_id === strand.id) }))
    .filter((g) => g.items.length > 0 || true);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Term {theme.term_no} &middot; Theme {theme.theme_no}
          </p>
          <h3 className="text-base font-semibold">{theme.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{theme.learning_outcome}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <NodeDialog
            curriculumId={curriculum.id}
            nodeType="theme"
            strands={strands}
            defaults={{
              id: theme.id,
              title: theme.name,
              description: theme.learning_outcome,
              themeNo: theme.theme_no,
              termNo: theme.term_no,
            }}
            trigger={<Button size="sm" variant="outline">Edit theme</Button>}
          />
          <DeleteButton
            action={deleteNode}
            fields={{ id: theme.id, national_curriculum_id: curriculum.id }}
            confirmMessage={`Delete theme "${theme.name}"? This also deletes its sub-themes and every competence under them.`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Assessment guidelines</p>
          <NodeGuidelineAdd curriculum={curriculum} theme={theme} strands={strands} />
        </div>
        {theme.guidelines.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No guidelines yet.</p>
        ) : (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {guidelineGroups
              .filter((g) => g.items.length > 0)
              .map(({ strand, items }) => (
                <div key={strand.id}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {strandById.get(strand.id)?.name}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {items.map((g) => (
                      <li key={g.id} className="flex items-start justify-between gap-2 text-sm">
                        <span>{g.description}</span>
                        <span className="flex shrink-0 gap-1">
                          <GuidelineDialog
                            curriculumId={curriculum.id}
                            themeNodeId={theme.id}
                            strands={strands}
                            guideline={g}
                            trigger={<Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs">Edit</Button>}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NodeGuidelineAdd({
  curriculum,
  theme,
  strands,
}: {
  curriculum: NationalCurriculum;
  theme: NationalTheme;
  strands: NationalStrand[];
}) {
  return (
    <GuidelineDialog
      curriculumId={curriculum.id}
      themeNodeId={theme.id}
      strands={strands}
      trigger={
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
          <PlusIcon className="size-3.5" /> Add
        </Button>
      }
    />
  );
}

function SubthemeDetail({
  curriculum,
  theme,
  subtheme,
  strands,
}: {
  curriculum: NationalCurriculum;
  theme: NationalTheme;
  subtheme: NationalSubtheme;
  strands: NationalStrand[];
}) {
  return (
    <div className="space-y-4 rounded-lg border border-primary/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sub-theme {subtheme.code} &middot; one teaching week
          </p>
          <h4 className="text-base font-semibold">{subtheme.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{subtheme.content}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <NodeDialog
            curriculumId={curriculum.id}
            nodeType="sub_theme"
            parentId={theme.id}
            strands={strands}
            defaults={{
              id: subtheme.id,
              title: subtheme.name,
              description: subtheme.content,
              code: subtheme.code,
              position: subtheme.position,
            }}
            trigger={<Button size="sm" variant="outline">Edit sub-theme</Button>}
          />
          <DeleteButton
            action={deleteNode}
            fields={{ id: subtheme.id, national_curriculum_id: curriculum.id }}
            confirmMessage={`Delete sub-theme "${subtheme.name}"? This also deletes every competence under it.`}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {strands.map((strand) => {
          const items = subtheme.competences.filter((c) => c.strand_id === strand.id);
          return (
            <div key={strand.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{strand.name}</p>
                <NodeDialog
                  curriculumId={curriculum.id}
                  nodeType="competence"
                  parentId={subtheme.id}
                  strands={[strand]}
                  defaults={{ strandId: strand.id, sequenceOrder: items.length + 1 }}
                  trigger={
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs">
                      <PlusIcon className="size-3" /> Add
                    </Button>
                  }
                />
              </div>
              {items.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">None yet.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {items.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-2 text-sm">
                      <span className="flex items-start gap-1.5">
                        <RequirementBadge level={c.requirement_level} className="mt-0.5" />
                        {c.description}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        <NodeDialog
                          curriculumId={curriculum.id}
                          nodeType="competence"
                          parentId={subtheme.id}
                          strands={strands}
                          defaults={{
                            id: c.id,
                            title: c.description,
                            strandId: c.strand_id,
                            requirementLevel: c.requirement_level,
                            sequenceOrder: c.sort_order,
                          }}
                          trigger={<Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs">Edit</Button>}
                        />
                        <DeleteButton
                          action={deleteNode}
                          fields={{ id: c.id, national_curriculum_id: curriculum.id }}
                          label="×"
                          className="h-6 px-1.5 text-xs"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
