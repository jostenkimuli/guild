"use client";

import { CheckIcon, CircleIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { saveTimetable } from "@/app/actions/implementation";
import { selectClass } from "@/components/curriculum/form-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PERIODS_PER_DAY,
  type SavedTimetable,
} from "@/lib/curriculum/implementation";
import type { NationalCurriculum } from "@/lib/curriculum/national";
import {
  DAYS,
  validateTimetable,
  type TimetableSlot,
} from "@/lib/curriculum/timetable-rules";
import { cn } from "@/lib/utils";

const slotKey = (day: number, period: number) => `${day}:${period}`;

function colourFor(index: number): React.CSSProperties {
  return { backgroundColor: `hsl(${(index * 47) % 360} 65% 50% / 0.2)` };
}

export function TimetableEditor({
  ecosystemId,
  curriculum,
  saved,
}: {
  ecosystemId: string;
  curriculum: NationalCurriculum;
  saved: SavedTimetable | null;
}) {
  const router = useRouter();
  const allocations = curriculum.allocations;
  const indexById = useMemo(
    () => new Map(allocations.map((a, i) => [a.id, i])),
    [allocations],
  );
  const byId = useMemo(() => new Map(allocations.map((a) => [a.id, a])), [allocations]);

  const [periodsPerDay, setPeriodsPerDay] = useState(
    saved?.periodsPerDay ?? DEFAULT_PERIODS_PER_DAY,
  );
  const [grid, setGrid] = useState<Record<string, string>>(() =>
    Object.fromEntries((saved?.slots ?? []).map((s) => [slotKey(s.day, s.period), s.allocationId])),
  );
  const [selectedId, setSelectedId] = useState(allocations[0]?.id ?? "");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const slots: TimetableSlot[] = useMemo(
    () =>
      Object.entries(grid)
        .map(([key, allocationId]) => {
          const [day, period] = key.split(":").map(Number);
          return { day, period, allocationId };
        })
        .filter((s) => s.period <= periodsPerDay),
    [grid, periodsPerDay],
  );
  const validation = useMemo(() => validateTimetable(allocations, slots), [allocations, slots]);

  function change(next: Record<string, string>) {
    setGrid(next);
    setDirty(true);
    setMessage(null);
  }

  function place(day: number, period: number) {
    const key = slotKey(day, period);
    const current = grid[key];

    // Clicking a placed period removes it (the whole block for double lessons).
    if (current) {
      const a = byId.get(current);
      const block = a?.block_size ?? 1;
      let start = period;
      while (grid[slotKey(day, start - 1)] === current) start -= 1;
      const chunkStart = start + Math.floor((period - start) / block) * block;
      const next = { ...grid };
      for (let p = chunkStart; p < chunkStart + block; p += 1) {
        if (next[slotKey(day, p)] === current) delete next[slotKey(day, p)];
      }
      change(next);
      return;
    }

    const a = byId.get(selectedId);
    if (!a) return;
    const remaining = a.periods - (validation.placed[a.id] ?? 0);
    if (remaining < a.block_size) {
      setMessage({
        ok: false,
        text: `All ${a.periods} periods of ${a.label} are already placed. Click a placed period to remove it.`,
      });
      return;
    }
    if (period + a.block_size - 1 > periodsPerDay) {
      setMessage({ ok: false, text: `${a.label} needs ${a.block_size} periods together, and there is not enough room left in the day.` });
      return;
    }
    for (let p = period; p < period + a.block_size; p += 1) {
      if (grid[slotKey(day, p)]) {
        setMessage({ ok: false, text: `${a.label} needs ${a.block_size} free periods together.` });
        return;
      }
    }
    const next = { ...grid };
    for (let p = period; p < period + a.block_size; p += 1) next[slotKey(day, p)] = a.id;
    change(next);
  }

  function submit(publish: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveTimetable({
        ecosystemId,
        nationalCurriculumId: curriculum.id,
        periodsPerDay,
        slots,
        publish,
      });
      if (result.success) {
        setDirty(false);
        setMessage({ ok: true, text: publish ? "Timetable published." : "Draft saved." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error ?? "Could not save." });
      }
    });
  }

  const published = saved?.publishedAt && !dirty;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Pick a learning area, then click empty periods to place it. Click a placed period to
          remove it.
        </p>
        {published ? (
          <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
            Published {saved?.publishedAt?.slice(0, 10)}
          </Badge>
        ) : (
          <Badge variant="secondary">{dirty ? "Unsaved changes" : "Not published"}</Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr_18rem]">
        {/* Palette */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Learning areas
          </p>
          <ul className="space-y-1">
            {allocations.map((a) => {
              const placed = validation.placed[a.id] ?? 0;
              const active = a.id === selectedId;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    aria-pressed={active}
                    style={colourFor(indexById.get(a.id) ?? 0)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-3 py-1.5 text-left text-sm",
                      active ? "border-primary ring-2 ring-primary/40" : "border-transparent",
                    )}
                  >
                    <span>{a.label}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        placed === a.periods ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      {placed}/{a.periods}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="periods_per_day">Periods each day</Label>
            <select
              id="periods_per_day"
              className={selectClass}
              value={periodsPerDay}
              onChange={(e) => {
                setPeriodsPerDay(Number(e.target.value));
                setDirty(true);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="min-w-0 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="w-16 border-b p-2 text-left font-medium">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="border-b p-2 text-left font-medium">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map((period) => (
                <tr key={period}>
                  <th scope="row" className="border-b p-2 text-left font-normal text-muted-foreground">
                    {period}
                  </th>
                  {DAYS.map((_, dayIndex) => {
                    const day = dayIndex + 1;
                    const id = grid[slotKey(day, period)];
                    const a = id ? byId.get(id) : undefined;
                    return (
                      <td key={day} className="border-b p-1">
                        <button
                          type="button"
                          onClick={() => place(day, period)}
                          aria-label={
                            a
                              ? `${DAYS[dayIndex]} period ${period}: ${a.label}. Click to remove.`
                              : `${DAYS[dayIndex]} period ${period}: empty. Click to place.`
                          }
                          style={a ? colourFor(indexById.get(a.id) ?? 0) : undefined}
                          className={cn(
                            "h-9 w-full rounded-md px-2 text-left text-xs",
                            a ? "font-medium" : "border border-dashed text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {a ? a.label : "+"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rules check */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            National rules check
          </p>
          <ul className="space-y-2">
            {validation.checks.map((check) => (
              <li key={check.id} className="flex items-start gap-2 text-sm">
                {check.status === "pass" ? (
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : check.status === "fail" ? (
                  <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                ) : (
                  <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  {check.label}
                  {check.detail ? (
                    <span className="block text-xs text-muted-foreground">{check.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-2xl font-semibold tabular-nums">
            {validation.totalPlaced} / {validation.totalRequired}
            <span className="ml-1 text-sm font-normal text-muted-foreground">periods</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-3">
        {message ? (
          <p className={cn("mr-auto text-sm", message.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
            {message.text}
          </p>
        ) : null}
        <Button variant="outline" disabled={pending} onClick={() => submit(false)}>
          Save draft
        </Button>
        <Button
          disabled={pending || !validation.canPublish}
          title={validation.canPublish ? undefined : "Place every required period and meet the rules first"}
          onClick={() => submit(true)}
        >
          Publish timetable
        </Button>
      </div>
    </div>
  );
}
