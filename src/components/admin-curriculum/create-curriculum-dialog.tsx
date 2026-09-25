"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";

import { saveNationalCurriculum } from "@/app/actions/national-curriculum-admin";
import { selectClass } from "@/components/curriculum/form-styles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ECOSYSTEM_TYPE_LABELS } from "@/lib/ecosystems";

export function CreateCurriculumDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(saveNationalCurriculum, { success: false });
  const handled = useRef(false);

  useEffect(() => {
    if (state.success && state.id && !handled.current) {
      handled.current = true;
      setOpen(false);
      router.push(`/admin/curricula/${state.id}`);
    }
    if (open) handled.current = false;
  }, [state, open, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add national curriculum</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a national curriculum</DialogTitle>
          <DialogDescription>
            One row per official document/level (e.g. Uganda P1, or a future O-Level, A-Level or
            Upper Primary). You&apos;ll add its themes, strands and rules after creating it.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-slug">Slug</Label>
              <Input id="c-slug" name="slug" placeholder="e.g. uganda-p4-p7" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-class-level">Class level</Label>
              <Input id="c-class-level" name="class_level" placeholder="e.g. P4-P7" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" name="title" placeholder="The full document title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-authority">Authority</Label>
            <Input id="c-authority" name="authority" placeholder="e.g. NCDC, Ministry of Education" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-cycle-label">Cycle label</Label>
              <Input id="c-cycle-label" name="cycle_label" placeholder="e.g. Upper Primary" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-edition">Edition</Label>
              <Input id="c-edition" name="edition" placeholder="e.g. 2024" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-ecosystem-type">School type</Label>
            <select id="c-ecosystem-type" name="ecosystem_type" className={selectClass} defaultValue="primary_school">
              {Object.entries(ECOSYSTEM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-source-url">Source URL (optional)</Label>
            <Input id="c-source-url" name="source_url" type="url" placeholder="https://ncdc.go.ug/..." />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
