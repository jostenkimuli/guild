"use client";

import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { saveImplementationWeek } from "@/app/actions/implementation";
import { selectClass } from "@/components/curriculum/form-styles";
import { RequirementBadge } from "@/components/curriculum/requirement-badge";
import { StatusBadge } from "@/components/implementation/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  ImplementationWeek,
  TeacherOption,
} from "@/lib/curriculum/implementation";
import {
  termWeeks,
  thematicStrands,
  type NationalCurriculum,
  type TermWeek,
} from "@/lib/curriculum/national";
import { cn } from "@/lib/utils";

function formatDates(week: ImplementationWeek | undefined): string {
  if (!week?.plannedStart && !week?.plannedEnd) return "Not set";
  return [week?.plannedStart, week?.plannedEnd].filter(Boolean).join(" to ");
}

export function TermPlan({
  ecosystemId,
  curriculum,
  term,
  weeks,
  teachers,
  initialSubthemeId,
}: {
  ecosystemId: string;
  curriculum: NationalCurriculum;
  term: number;
  weeks: Record<string, ImplementationWeek>;
  teachers: TeacherOption[];
  initialSubthemeId: string | null;
}) {
  const rows = termWeeks(curriculum, term);
  const [openId, setOpenId] = useState<string | null>(
    rows.some((r) => r.subtheme.id === initialSubthemeId) ? initialSubthemeId : null,
  );
  const open = rows.find((r) => r.subtheme.id === openId) ?? null;
  const teacherName = (id: string | null) =>
    id ? (teachers.find((t) => t.id === id)?.name ?? "Unknown") : null;
  const hasOrientation = curriculum.orientation_terms.includes(term);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        One row for each teaching week of Term {term}. The theme and sub-theme are set by the
        national curriculum (<LockIcon className="inline size-3" /> locked). Open a week to plan how
        your school will teach it.
      </p>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Week</TableHead>
              <TableHead>Theme and sub-theme</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Planned dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasOrientation ? (
              <TableRow className="text-muted-foreground">
                <TableCell>1</TableCell>
                <TableCell colSpan={5}>
                  Orientation week. Introduce the class to school routines, play areas and
                  Physical Education.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map((row) => {
              const week = weeks[row.subtheme.id];
              const status = week?.status ?? "not_started";
              const gap = !week || !week.teacherId || status === "not_started";
              return (
                <TableRow
                  key={row.subtheme.id}
                  className={cn(gap && "bg-amber-50 dark:bg-amber-500/5")}
                >
                  <TableCell className="tabular-nums">{row.weekNo}</TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LockIcon className="size-3" />
                      Theme {row.theme.theme_no}: {row.theme.name}
                    </p>
                    <p className="font-medium">
                      {row.subtheme.code} {row.subtheme.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    {teacherName(week?.teacherId ?? null) ?? (
                      <span className="text-amber-700 dark:text-amber-300">No teacher yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDates(week)}</TableCell>
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={status === "not_started" ? "default" : "outline"}
                      onClick={() => setOpenId(row.subtheme.id)}
                    >
                      {status === "not_started" ? "Plan" : "Open"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={open !== null} onOpenChange={(next) => !next && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-5xl">
          {open ? (
            <WeekDetail
              key={open.subtheme.id}
              ecosystemId={ecosystemId}
              curriculum={curriculum}
              row={open}
              week={weeks[open.subtheme.id]}
              teachers={teachers}
              onClose={() => setOpenId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function WeekDetail({
  ecosystemId,
  curriculum,
  row,
  week,
  teachers,
  onClose,
}: {
  ecosystemId: string;
  curriculum: NationalCurriculum;
  row: TermWeek;
  week: ImplementationWeek | undefined;
  teachers: TeacherOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveImplementationWeek, {
    success: false,
  });
  const strands = thematicStrands(curriculum);
  const { theme, subtheme } = row;

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <SheetTitle>
          Week {row.weekNo}: {subtheme.code} {subtheme.name}
        </SheetTitle>
        <SheetDescription>
          Term {theme.term_no} · Theme {theme.theme_no}: {theme.name}
        </SheetDescription>
      </SheetHeader>

      <form action={formAction} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="ecosystem_id" value={ecosystemId} />
        <input type="hidden" name="subtheme_id" value={subtheme.id} />

        <div className="grid flex-1 gap-6 overflow-y-auto p-4 lg:grid-cols-2">
          {/* LEFT: what the nation requires (locked) */}
          <section className="space-y-4 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <LockIcon className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">National requirement</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              NCDC {curriculum.class_level} › Theme {theme.theme_no} {theme.name} › {subtheme.code}{" "}
              {subtheme.name}
            </p>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Learning outcome
              </p>
              <p className="mt-0.5 text-sm">{theme.learning_outcome}</p>
            </div>
            {strands.map((strand) => {
              const items = subtheme.competences.filter((c) => c.strand_id === strand.id);
              if (items.length === 0) return null;
              const levels = [...new Set(items.map((c) => c.requirement_level))];
              return (
                <div key={strand.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{strand.name}</p>
                    {levels.map((level) => (
                      <RequirementBadge key={level} level={level} />
                    ))}
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                    {items.map((c) => (
                      <li key={c.id}>{c.description}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {subtheme.competences.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                The competences for this week are not loaded yet. Content: {subtheme.content}
              </p>
            ) : null}
            {theme.guidelines.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Assessment guidelines for the theme
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                  {theme.guidelines.slice(0, 6).map((g) => (
                    <li key={g.id}>{g.description}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* RIGHT: what the school will do (editable) */}
          <section className="space-y-4">
            <h3 className="font-semibold">Our school&apos;s plan</h3>

            {week?.reviewComment ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
                <span className="font-medium">Changes requested:</span> {week.reviewComment}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="teacher_id">Teacher responsible</Label>
                <select
                  id="teacher_id"
                  name="teacher_id"
                  className={selectClass}
                  defaultValue={week?.teacherId ?? ""}
                >
                  <option value="">No teacher yet</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="planned_start">Starts</Label>
                <Input
                  id="planned_start"
                  name="planned_start"
                  type="date"
                  defaultValue={week?.plannedStart ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="planned_end">Ends</Label>
                <Input
                  id="planned_end"
                  name="planned_end"
                  type="date"
                  defaultValue={week?.plannedEnd ?? ""}
                />
              </div>
            </div>

            {strands.map((strand) => (
              <div key={strand.id} className="space-y-1.5">
                <Label htmlFor={`strand-${strand.id}`}>How we will teach {strand.name}</Label>
                <Textarea
                  id={`strand-${strand.id}`}
                  name={`strand:${strand.id}`}
                  rows={3}
                  maxLength={4000}
                  placeholder="Activities, local examples, materials from our community"
                  defaultValue={week?.strandPlans[strand.id] ?? ""}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="local_language_notes">Local language notes</Label>
              <Textarea
                id="local_language_notes"
                name="local_language_notes"
                rows={2}
                maxLength={4000}
                placeholder="Words and phrases in the language of instruction"
                defaultValue={week?.localLanguageNotes ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sne_adaptations">Adaptations for learners with special needs</Label>
              <Textarea
                id="sne_adaptations"
                name="sne_adaptations"
                rows={2}
                maxLength={4000}
                defaultValue={week?.sneAdaptations ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checking_notes">How competences will be checked</Label>
              <Textarea
                id="checking_notes"
                name="checking_notes"
                rows={2}
                maxLength={4000}
                placeholder="Check-list items the teacher will tick during normal lessons"
                defaultValue={week?.checkingNotes ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review_comment">Note to the teacher (for Request changes)</Label>
              <Textarea
                id="review_comment"
                name="review_comment"
                rows={2}
                maxLength={4000}
                defaultValue=""
              />
            </div>
          </section>
        </div>

        <div className="space-y-2 border-t p-4">
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" name="intent" value="changes" variant="outline" disabled={pending}>
              Request changes
            </Button>
            <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
              Save draft
            </Button>
            <Button type="submit" name="intent" value="ready" variant="outline" disabled={pending}>
              Mark ready
            </Button>
            <Button type="submit" name="intent" value="approved" disabled={pending}>
              Approve
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
