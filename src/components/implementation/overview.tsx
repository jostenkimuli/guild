import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StepState = "done" | "active" | "todo" | "later";

export type ChainStep = {
  title: string;
  detail: string;
  state: StepState;
};

export type SummaryCard = {
  title: string;
  value: string;
  hint: string;
  href: string;
  ok: boolean;
};

const STEP_STYLES: Record<StepState, string> = {
  done: "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10",
  active: "border-primary bg-primary/5",
  todo: "border-dashed",
  later: "border-dashed opacity-60",
};

/** The chain from national curriculum down to learner assessment. */
export function ImplementationChain({ steps }: { steps: ChainStep[] }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={cn("rounded-lg border p-3", STEP_STYLES[step.state])}
        >
          <p className="text-xs text-muted-foreground">Step {index + 1}</p>
          <p className="text-sm font-semibold">{step.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.hint}</p>
            <Link
              href={card.href}
              className={cn(
                "inline-block text-sm underline-offset-4 hover:underline",
                card.ok ? "text-muted-foreground" : "font-medium text-amber-700 dark:text-amber-300",
              )}
            >
              {card.ok ? "Open" : "Fix"}
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
