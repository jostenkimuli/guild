import Link from "next/link";

import type { NationalCurriculumSummary } from "@/lib/curriculum/national";
import { cn } from "@/lib/utils";

/** Chips for switching class level. `hrefFor` builds the link for a class. */
export function ClassSelector({
  curricula,
  selectedSlug,
  hrefFor,
}: {
  curricula: NationalCurriculumSummary[];
  selectedSlug: string;
  hrefFor: (curriculum: NationalCurriculumSummary) => string;
}) {
  return (
    <nav aria-label="Class level" className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Class</span>
      {curricula.map((c) => (
        <Link
          key={c.id}
          href={hrefFor(c)}
          aria-current={c.slug === selectedSlug ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            c.slug === selectedSlug
              ? "border-primary bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {c.class_level}
        </Link>
      ))}
      <span className="text-xs text-muted-foreground">More classes appear as they are loaded.</span>
    </nav>
  );
}
