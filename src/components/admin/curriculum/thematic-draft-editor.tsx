"use client";

import { useState } from "react";
import { CheckIcon, RotateCcwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManualThematicEntry } from "@/components/admin/curriculum/manual-thematic-entry";
import {
  toThematicDraftIdentity,
  toThematicManualEntry,
  type MockThematicCurriculum,
  type ThematicDraftIdentity,
  type ThematicManualEntry,
} from "@/lib/playground/thematic-curriculum";

const LEVEL_OPTIONS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"];

export function ThematicDraftEditor({
  curriculum,
  onCancel,
  onSave,
}: {
  curriculum: MockThematicCurriculum;
  onCancel: () => void;
  onSave: (identity: ThematicDraftIdentity, entry: ThematicManualEntry) => void;
}) {
  const [identity, setIdentity] = useState<ThematicDraftIdentity>(() =>
    toThematicDraftIdentity(curriculum),
  );
  const [entry, setEntry] = useState<ThematicManualEntry>(() =>
    toThematicManualEntry(curriculum),
  );

  const setField = (field: keyof ThematicDraftIdentity, value: string | number) =>
    setIdentity((prev) => ({ ...prev, [field]: value }));

  const canSave =
    identity.officialTitle.trim().length > 0 &&
    identity.code.trim().length > 0 &&
    identity.level.length > 0;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">
            Editing · {curriculum.name}
          </p>
          <Badge variant="outline">
            <RotateCcwIcon />
            Draft
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" type="button" disabled={!canSave} onClick={() => onSave(identity, entry)}>
            <CheckIcon />
            Save draft
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document identity</CardTitle>
          <CardDescription>
            Publishing metadata for the document. The record ID stays stable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="de-title">Official title</Label>
            <Input
              id="de-title"
              value={identity.officialTitle}
              placeholder="e.g. The National Primary School Curriculum for Uganda — Primary 1"
              onChange={(event) => setField("officialTitle", event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="de-code">Code</Label>
              <Input
                id="de-code"
                value={identity.code}
                placeholder="e.g. NCDC-P1"
                onChange={(event) => setField("code", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="de-edition">Edition</Label>
              <Input
                id="de-edition"
                value={identity.edition}
                placeholder="e.g. 2007"
                onChange={(event) => setField("edition", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="de-year">Year</Label>
              <Input
                id="de-year"
                type="number"
                value={identity.year}
                onChange={(event) =>
                  setField("year", Number.parseInt(event.target.value, 10) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="de-isbn">ISBN</Label>
              <Input
                id="de-isbn"
                value={identity.isbn}
                placeholder="e.g. 978-9970-117-05-5"
                onChange={(event) => setField("isbn", event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Level</Label>
            <div className="flex flex-wrap gap-1.5">
              {LEVEL_OPTIONS.map((candidate) => {
                const active = identity.level === candidate;
                return (
                  <Button
                    key={candidate}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => setField("level", candidate)}
                  >
                    {candidate}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">
          Anatomy captured by hand, section by section — the four tabs mirror
          the read-only preview. Saving keeps this document as a draft.
        </p>
        <ManualThematicEntry value={entry} onChange={setEntry} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" type="button" disabled={!canSave} onClick={() => onSave(identity, entry)}>
          <CheckIcon />
          Save draft
        </Button>
      </div>
    </div>
  );
}