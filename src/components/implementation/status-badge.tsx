import { Badge } from "@/components/ui/badge";
import {
  STATUS_LABELS,
  type ImplementationStatus,
} from "@/lib/curriculum/implementation";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ImplementationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  draft: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  ready: "bg-primary/10 text-primary",
  approved:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
};

export function StatusBadge({ status }: { status: ImplementationStatus }) {
  return (
    <Badge variant="secondary" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
