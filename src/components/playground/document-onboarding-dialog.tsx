"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  ScanTextIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManualThematicEntry } from "@/components/playground/manual-thematic-entry";
import {
  createEmptyThematicManualEntry,
  summarizeThematicManualEntry,
  type ThematicManualEntry,
} from "@/lib/playground/thematic-curriculum";

const LEVEL_OPTIONS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"];

export type OnboardingStructureType = "thematic" | "subject";

export type OnboardingEntryMode = "pdf" | "manual";

export interface OnboardingCreatePayload {
  structureType: OnboardingStructureType;
  country: string;
  issuer: string;
  officialTitle: string;
  code: string;
  edition: string;
  year: number;
  levels: string[];
  isbn: string;
  sourcePath: string;
  entryMode?: OnboardingEntryMode;
  entry?: ThematicManualEntry;
  note?: string;
}

function StepBadge({ step }: { step: number }) {
  return (
    <Badge variant="outline" className="gap-1 font-mono text-[11px]">
      Step {step} of 3
    </Badge>
  );
}

export function DocumentOnboardingDialog({
  structureType,
  onOpenChange,
  onCreate,
}: {
  structureType: OnboardingStructureType;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: OnboardingCreatePayload) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [country, setCountry] = useState("Uganda");
  const [issuer, setIssuer] = useState(
    "National Curriculum Development Centre (NCDC) — Ministry of Education and Sports",
  );
  const [officialTitle, setOfficialTitle] = useState("");
  const [code, setCode] = useState("");
  const [edition, setEdition] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [level, setLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<Set<string>>(new Set());
  const [isbn, setIsbn] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [entryMode, setEntryMode] = useState<OnboardingEntryMode>("pdf");
  const [manualEntry, setManualEntry] = useState<ThematicManualEntry>(
    createEmptyThematicManualEntry,
  );

  const manualAvailable = structureType === "thematic";
  const manualActive = manualAvailable && entryMode === "manual";
  const manualSummary = summarizeThematicManualEntry(manualEntry);

  const toggleLevel = (candidate: string) => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(candidate)) next.delete(candidate);
      else next.add(candidate);
      return next;
    });
  };

  const canContinue =
    step === 1
      ? country.trim().length > 0 && issuer.trim().length > 0
      : step === 2
        ? officialTitle.trim().length > 0 &&
          code.trim().length > 0 &&
          year.trim().length > 0 &&
          (structureType === "thematic" ? level !== null : levels.size > 0)
        : true;

  const submit = () => {
    onCreate({
      structureType,
      country: country.trim(),
      issuer: issuer.trim(),
      officialTitle: officialTitle.trim(),
      code: code.trim(),
      edition: edition.trim(),
      year: Number.parseInt(year, 10),
      levels:
        structureType === "thematic"
          ? level
            ? [level]
            : []
          : [...levels].sort(),
      isbn: isbn.trim(),
      sourcePath: sourcePath.trim(),
      entryMode,
      entry: manualActive ? manualEntry : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg",
          manualActive && "sm:max-w-5xl max-h-[92vh] overflow-y-auto",
        )}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {structureType === "thematic" ? (
                <MapPinIcon className="size-4 text-primary" />
              ) : (
                <FileTextIcon className="size-4 text-primary" />
              )}
              <DialogTitle className="text-base">
                New {structureType === "thematic" ? "curriculum" : "template"}
              </DialogTitle>
            </div>
            <StepBadge step={step} />
          </div>
          <DialogDescription className="text-xs">
            {structureType === "thematic" ? (
              <>
                Thematic curriculum document (P1–P3 strand). Registers the
                document identity + source reference; content stays empty until
                the transcription pipeline (Phase C PDF extraction) fills the
                four anatomy components.
              </>
            ) : (
              <>
                National template (subject-based arm). Registers the template
                identity + source reference; content stays empty until
                transcription fills the four anatomy components.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="oc-country">Country</Label>
              <Input
                id="oc-country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oc-issuer">Issuing authority</Label>
              <Input
                id="oc-issuer"
                value={issuer}
                onChange={(event) => setIssuer(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {structureType === "thematic"
                  ? "Thematic strand — content is organised by level (one document per level, e.g. P1)."
                  : "Subject strand — content is organised across national subjects + level bands."}
              </p>
              <Badge variant="secondary">
                {structureType === "thematic" ? "Thematic" : "Subject-based"}
              </Badge>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="oc-title">Official title</Label>
              <Input
                id="oc-title"
                value={officialTitle}
                placeholder={
                  structureType === "thematic"
                    ? "e.g. The National Primary School Curriculum for Uganda — Primary 1"
                    : "e.g. The National Primary School Curriculum for Uganda — Primary Mathematics Syllabi"
                }
                onChange={(event) => setOfficialTitle(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="oc-code">Code</Label>
                <Input
                  id="oc-code"
                  value={code}
                  placeholder={structureType === "thematic" ? "e.g. NCDC-P1" : "e.g. NCDC-MATHS"}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oc-edition">Edition</Label>
                <Input
                  id="oc-edition"
                  value={edition}
                  placeholder="e.g. 2007"
                  onChange={(event) => setEdition(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oc-year">Year</Label>
                <Input
                  id="oc-year"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oc-isbn">ISBN (optional)</Label>
                <Input
                  id="oc-isbn"
                  value={isbn}
                  placeholder="e.g. 978-9970-117-05-5"
                  onChange={(event) => setIsbn(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Levels covered</Label>
              <div className="flex flex-wrap gap-1.5">
                {LEVEL_OPTIONS.map((candidate) => {
                  const isSingle =
                    structureType === "thematic" && level === candidate;
                  const isInSet = structureType !== "thematic" && levels.has(candidate);
                  const active = isSingle || isInSet;
                  return (
                    <Button
                      key={candidate}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (structureType === "thematic") setLevel(candidate);
                        else toggleLevel(candidate);
                      }}
                    >
                      {candidate}
                    </Button>
                  );
                })}
              </div>
            </div>
            {manualAvailable ? (
              <div className="space-y-1.5">
                <Label>Capture method</Label>
                <div className="inline-flex w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setEntryMode("pdf")}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      entryMode === "pdf"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ScanTextIcon className="size-4" />
                    PDF extraction (reference)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode("manual")}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      entryMode === "manual"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <PencilIcon className="size-4" />
                    Manual entry
                  </button>
                </div>
              </div>
            ) : null}

            {manualActive ? (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Capture the document by hand, section by section, in the same
                  shape as the four anatomy tabs. The created draft is hydrated
                  immediately — no PDF transcription required.
                </p>
                <ManualThematicEntry value={manualEntry} onChange={setManualEntry} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="oc-source">Source PDF reference</Label>
                <Input
                  id="oc-source"
                  value={sourcePath}
                  placeholder="e.g. tool-output/p1_thematic_extract.txt"
                  onChange={(event) => setSourcePath(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Place the extracted PDF text at this path so the transcription
                  pipeline (Phase C pypdf + cryptography workflow used for P3)
                  can fill the four anatomy components.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identity
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <p>{country}</p>
                <p className="text-muted-foreground">{issuer}</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Source document
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="font-medium">{officialTitle || "Untitled"}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {code || "pending code"} · {edition || "pending edition"} · {year}
                </p>
                {sourcePath ? (
                  <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <ScanTextIcon className="size-3" />
                    {sourcePath}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {structureType === "thematic"
                    ? "Level: " + (level ?? "—")
                    : "Levels: " +
                      (levels.size > 0 ? [...levels].sort().join(", ") : "—")}
                </p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <SparklesIcon className="size-3" />
                {manualActive ? "Captured content — manual entry" : "Content — awaiting transcription"}
              </p>
              {manualActive ? (
                <>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Intent</dt>
                    <dd>{manualSummary.intent}</dd>
                    <dt className="text-muted-foreground">Content</dt>
                    <dd>{manualSummary.content}</dd>
                    <dt className="text-muted-foreground">Learning &amp; Teaching</dt>
                    <dd>{manualSummary.learningTeaching}</dd>
                    <dt className="text-muted-foreground">Assessment</dt>
                    <dd>{manualSummary.assessment}</dd>
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created as a <Badge variant="outline">draft</Badge> hydrated
                    from the manual capture — the four anatomy tabs render this
                    immediately.
                  </p>
                </>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Created as a <Badge variant="outline">draft</Badge> with 0/4
                  anatomy coverage (Intent · Content · Learning &amp; Teaching ·
                  Assessment all empty). The four components stay empty until
                  embedded text is extracted from the source PDF and transcribed.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}>
              <ArrowLeftIcon />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          {step < 3 ? (
            <Button size="sm" disabled={!canContinue} onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}>
              Continue
              <ArrowRightIcon />
            </Button>
          ) : (
            <Button size="sm" onClick={submit}>
              <PlusIcon />
              {structureType === "thematic" ? "Create curriculum" : "Create template"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");
