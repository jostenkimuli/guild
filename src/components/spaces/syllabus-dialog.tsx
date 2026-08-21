"use client";

import * as React from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createSyllabus, type SyllabusActionState } from "@/app/actions/syllabus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BreakdownRow = { label: string; weight: string };

interface SyllabusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  curricula: { id: string; name: string; year: number }[];
  existing?: {
    curriculum_id: string;
    grading_policy: {
      pass_mark?: number;
      grade_breakdown: { label: string; weight_pct: number }[];
    } | null;
    required_materials: string[] | null;
    office_hours: string | null;
    classroom_expectations: string | null;
  } | null;
}

function SyllabusDialog({
  isOpen,
  onOpenChange,
  curricula,
  existing,
}: SyllabusDialogProps) {
  const [state, setState] = useState<SyllabusActionState>({ success: false });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onOpenChange(false);
    }
  }, [state, router, onOpenChange]);

  // Initial state from existing syllabus
  const [breakdowns, setBreakdowns] = React.useState<BreakdownRow[]>(() => {
    if (
      existing?.grading_policy?.grade_breakdown?.length
    ) {
      return existing.grading_policy.grade_breakdown.map((b) => ({
        label: b.label,
        weight: String(b.weight_pct),
      }));
    }
    return [];
  });

  const [materials, setMaterials] = React.useState<string[]>(() => {
    if (existing?.required_materials?.length) {
      return existing.required_materials;
    }
    return [];
  });

  const selectedCurriculumId = React.useState<string>(() => {
    return curricula[0]?.id ?? "";
  })[0];

  // Compute total weight
  const totalWeight = breakdowns.reduce(
    (sum, b) => sum + (Number(b.weight) || 0),
    0,
  );
  const totalClass = Math.round(totalWeight);

  // Handler to submit the syllabus form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Materials are managed as React state (chips), not as form inputs,
    // so we serialize them here instead of reading from FormData.
    formData.set("required_materials", materials.filter(Boolean).join("\n"));

    // Ensure pass_mark is set (default 50)
    const passMarkRaw = formData.get("pass_mark");
    const passMark = passMarkRaw != null ? Number(passMarkRaw) : 50;
    formData.set("pass_mark", passMark.toString());

    // Set breakdown_count so the server action knows how many rows to read
    formData.set("breakdown_count", String(breakdowns.length));

    startTransition(async () => {
      const result = await createSyllabus({ success: false }, formData);
      setState(result);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit Syllabus" : "Create Syllabus"}
          </DialogTitle>
          <DialogDescription>
            {existing ? "Modify the syllabus for the selected master curriculum" : "Set up a new syllabus linked to a master curriculum"}
          </DialogDescription>
        </DialogHeader>

        <form id="syllabus-form" onSubmit={handleSubmit} className="space-y-3">
          {/* Linked Master Curriculum */}
          <div>
            <Label htmlFor="curriculum-select">Linked Master Curriculum</Label>
            <select
              id="curriculum-select"
              name="curriculum_id"
              defaultValue={selectedCurriculumId}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Select a master curriculum
              </option>
              {curricula.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.year}
                </option>
              ))}
            </select>
          </div>

          {/* Grading Policy */}
          <div>
            <Label>Grading Policy</Label>
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
                  Add grading components (e.g. Homework 20%, Mid-term 30%, Final Exam 50%).
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
                      className="max-w-xs"
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
            <div className="mt-2 flex items-center gap-2">
              <Badge className="text-xs">{totalClass}%</Badge>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>

          {/* Required Materials chips */}
          <div>
            <Label>Required Materials</Label>
            <div className="space-y-2">
              {materials.map((material, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-variant text-on-surface-variant font-body-md text-sm"
                >
                  <span className="material-symbols-outlined">close</span>
                  <span>{material}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Calculus textbook"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.currentTarget.value.trim()) {
                        setMaterials((prev) => [...prev, e.currentTarget.value.trim()]);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMaterials((prev) => [...prev, ""])}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Instructor Notes */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="office-hours">Office Hours & Availability</Label>
              <Textarea
                id="office-hours"
                name="office_hours"
                rows={3}
                defaultValue={existing?.office_hours ?? ""}
                placeholder="e.g. Tuesdays and Thursdays 3-4pm. Contact: demo@theguild.dev"
              />
            </div>
            <div>
              <Label htmlFor="classroom-expectations">Classroom Expectations</Label>
              <Textarea
                id="classroom-expectations"
                name="classroom_expectations"
                rows={3}
                defaultValue={existing?.classroom_expectations ?? ""}
                placeholder="e.g. Bring all materials and homework to every class."
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Cancel"}
          </Button>
          <Button
            type="submit"
            form="syllabus-form"
            disabled={isPending}
            className="ml-auto"
          >
            {existing ? "Update syllabus" : "Create syllabus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SyllabusDialog };