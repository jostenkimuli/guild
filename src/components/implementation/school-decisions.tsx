"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { saveSchoolDecision } from "@/app/actions/implementation";
import { RequirementBadge } from "@/components/curriculum/requirement-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DECISIONS,
  optionLabel,
  type DecisionDefinition,
} from "@/lib/curriculum/decisions";
import type { SavedDecision } from "@/lib/curriculum/implementation";
import type { NationalRule } from "@/lib/curriculum/national";

export function SchoolDecisions({
  ecosystemId,
  curriculumId,
  decisions,
  rules,
}: {
  ecosystemId: string;
  curriculumId: string;
  decisions: Record<string, SavedDecision>;
  rules: NationalRule[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The national curriculum leaves these choices to your school. Each card quotes the national
        rule first, then asks for your decision.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {DECISIONS.map((def) => (
          <DecisionCard
            key={def.key}
            def={def}
            ecosystemId={ecosystemId}
            curriculumId={curriculumId}
            saved={decisions[def.key]}
            rules={def.ruleGroup ? rules.filter((r) => r.rule_group === def.ruleGroup) : []}
          />
        ))}
      </div>
    </div>
  );
}

function DecisionCard({
  def,
  ecosystemId,
  curriculumId,
  saved,
  rules,
}: {
  def: DecisionDefinition;
  ecosystemId: string;
  curriculumId: string;
  saved: SavedDecision | undefined;
  rules: NationalRule[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveSchoolDecision, {
    success: false,
  });
  const [value, setValue] = useState(saved?.value ?? "");

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-4">
      <input type="hidden" name="ecosystem_id" value={ecosystemId} />
      <input type="hidden" name="national_curriculum_id" value={curriculumId} />
      <input type="hidden" name="decision_key" value={def.key} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{def.title}</h3>
        {saved ? (
          <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
            Decided {saved.decidedAt.slice(0, 10)}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
            Needs decision
          </Badge>
        )}
      </div>

      <div className="space-y-1.5 rounded-md bg-muted/40 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          National rule
        </p>
        {rules.map((rule) => (
          <p key={rule.id} className="flex items-start gap-2 text-sm">
            <RequirementBadge level={rule.requirement_level} className="mt-0.5" />
            <span>{rule.description}</span>
          </p>
        ))}
        {def.ruleText ? <p className="text-sm">{def.ruleText}</p> : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{def.question}</legend>
        {def.options.map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="value"
              value={option.value}
              checked={value === option.value}
              onChange={() => setValue(option.value)}
              className="mt-0.5 size-4 accent-primary"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {def.detail && value === def.detail.whenValue ? (
        <div className="space-y-1.5">
          <Label htmlFor={`detail-${def.key}`}>{def.detail.label}</Label>
          <Input
            id={`detail-${def.key}`}
            name="detail"
            maxLength={80}
            placeholder={def.detail.placeholder}
            defaultValue={saved?.detail ?? ""}
          />
        </div>
      ) : null}

      {saved ? (
        <p className="text-xs text-muted-foreground">
          Current choice: {optionLabel(def, saved.value)}
          {saved.detail ? ` (${saved.detail})` : ""}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending || !value}>
          {pending ? "Saving…" : "Save decision"}
        </Button>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>
        ) : null}
      </div>
    </form>
  );
}
