import { Badge } from "@/components/ui/badge";
import {
  REQUIREMENT_HELP,
  REQUIREMENT_LABELS,
  REQUIREMENT_LEVELS,
  REQUIREMENT_STYLES,
  type RequirementLevel,
} from "@/lib/curriculum/requirement";
import { cn } from "@/lib/utils";

export function RequirementBadge({
  level,
  className,
}: {
  level: RequirementLevel;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      title={REQUIREMENT_HELP[level]}
      className={cn(REQUIREMENT_STYLES[level], className)}
    >
      {REQUIREMENT_LABELS[level]}
    </Badge>
  );
}

export function RequirementLegend() {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {REQUIREMENT_LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-2 text-sm">
            <RequirementBadge level={level} />
            <span className="text-muted-foreground">{REQUIREMENT_HELP[level]}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        These tags are TheGuild&apos;s reading of the document to help you see what
        is fixed and what is your school&apos;s choice. They are not NCDC labels.
      </p>
    </div>
  );
}
