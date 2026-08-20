"use client";

import { useEffect, useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import { createSyllabus } from "@/app/actions/syllabus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BreakdownRow = { label: string; weight: string };

export function SyllabusForm({
  curriculumId,
  back,
  existing,
}: {
  curriculumId: string;
  back: string;
  existing?: {
    grading_policy: {
      pass_mark: number;
      grade_breakdown: { label: string; weight_pct: number }[];
    };
    required_materials: string | null;
    instructor_notes: string | null;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(createSyllabus, {
    success: false,
  });
  const router = useRouter();

  const [breakdowns, setBreakdowns] = useState<BreakdownRow[]>(() => {
    if (existing?.grading_policy?.grade_breakdown) {
      return existing.grading_policy.grade_breakdown.map((b) => ({
        label: b.label,
        weight: String(b.weight_pct),
      }));
    }
    return [];
  });

  useEffect(() => {
    if (state.success) {
      router.push(back);
    }
  }, [state, router, back]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="curriculum_id" value={curriculumId} />
      <input type="hidden" name="breakdown_count" value={breakdowns.length} />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pass-mark">Pass mark (%)</Label>
          <Input
            id="pass-mark"
            name="pass_mark"
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={existing?.grading_policy?.pass_mark ?? 50}
            inputMode="numeric"
            required
            className="max-w-xs"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Grade breakdown</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setBreakdowns((rows) => [...rows, { label: "", weight: "" }])
              }
            >
              Add component
            </Button>
          </div>
          {breakdowns.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add grading components (e.g. Homework 20%, Mid-term 30%, Final
              Exam 50%).
            </p>
          ) : null}
          {breakdowns.map((row, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`breakdown-${index}-label`}>
                  Component {index + 1}
                </Label>
                <Input
                  id={`breakdown-${index}-label`}
                  name={`breakdown_${index}_label`}
                  defaultValue={row.label}
                  maxLength={100}
                  placeholder="e.g. Homework"
                  required
                />
              </div>
              <div className="w-28 space-y-1.5">
                <Label htmlFor={`breakdown-${index}-weight`}>Weight %</Label>
                <Input
                  id={`breakdown-${index}-weight`}
                  name={`breakdown_${index}_weight`}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={row.weight}
                  inputMode="numeric"
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBreakdowns((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="required-materials">Required materials</Label>
          <Textarea
            id="required-materials"
            name="required_materials"
            maxLength={4000}
            rows={3}
            defaultValue={existing?.required_materials ?? ""}
            placeholder="Textbooks, tools, or supplies students need"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instructor-notes">Instructor notes</Label>
          <Textarea
            id="instructor-notes"
            name="instructor_notes"
            maxLength={4000}
            rows={3}
            defaultValue={existing?.instructor_notes ?? ""}
            placeholder="Private notes about office hours, teaching approach, etc."
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : existing ? "Update syllabus" : "Create syllabus"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(back)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
