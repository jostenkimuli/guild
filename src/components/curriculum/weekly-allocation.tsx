import { ConsolePanel } from "@/components/console/panels";
import { RequirementBadge } from "@/components/curriculum/requirement-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  NationalAllocation,
  NationalRule,
} from "@/lib/curriculum/national";

const RULE_GROUP_TITLES: Record<NationalRule["rule_group"], string> = {
  language: "Language of instruction",
  timetable: "Timetable",
  assessment: "Assessment",
  teaching: "Teaching approach",
};

type Row =
  | { kind: "single"; allocation: NationalAllocation }
  | { kind: "group"; label: string; allocations: NationalAllocation[] };

// Allocations that share a group label (e.g. Music + Art and Craft) collapse
// into one group with a subtotal, in the order the document lists them.
function toRows(allocations: NationalAllocation[]): Row[] {
  const rows: Row[] = [];
  for (const allocation of allocations) {
    if (!allocation.group_label) {
      rows.push({ kind: "single", allocation });
      continue;
    }
    const existing = rows.find(
      (r): r is Extract<Row, { kind: "group" }> =>
        r.kind === "group" && r.label === allocation.group_label,
    );
    if (existing) existing.allocations.push(allocation);
    else rows.push({ kind: "group", label: allocation.group_label, allocations: [allocation] });
  }
  return rows;
}

export function WeeklyAllocation({
  allocations,
  rules,
  total,
}: {
  allocations: NationalAllocation[];
  rules: NationalRule[];
  total: number;
}) {
  const rows = toRows(allocations);
  const ruleGroups = (
    ["language", "timetable", "assessment", "teaching"] as const
  ).map((group) => ({
    group,
    rules: rules.filter((r) => r.rule_group === group),
  }));

  return (
    <ConsolePanel
      title="What every week must contain"
      description="The time each learning area gets, and the rules that come with it."
      contentClassName="grid gap-6 lg:grid-cols-2"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Weekly time allocation</h3>
          <RequirementBadge level="mandatory" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learning area</TableHead>
              <TableHead className="text-right">Periods</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) =>
              row.kind === "single" ? (
                <TableRow key={row.allocation.id}>
                  <TableCell>{row.allocation.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.allocation.periods}
                  </TableCell>
                </TableRow>
              ) : (
                <GroupRows key={row.label} label={row.label} allocations={row.allocations} />
              ),
            )}
            <TableRow className="bg-muted/40 font-semibold">
              <TableCell>Total each week</TableCell>
              <TableCell className="text-right tabular-nums">{total} periods</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Rules that come with it</h3>
        {ruleGroups.map(({ group, rules: groupRules }) =>
          groupRules.length === 0 ? null : (
            <div key={group} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {RULE_GROUP_TITLES[group]}
              </p>
              <ul className="space-y-1.5">
                {groupRules.map((rule) => (
                  <li key={rule.id} className="flex items-start gap-2 text-sm">
                    <RequirementBadge level={rule.requirement_level} className="mt-0.5" />
                    <span>{rule.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>
    </ConsolePanel>
  );
}

function GroupRows({
  label,
  allocations,
}: {
  label: string;
  allocations: NationalAllocation[];
}) {
  const subtotal = allocations.reduce((sum, a) => sum + a.periods, 0);
  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell className="text-right tabular-nums">{subtotal}</TableCell>
      </TableRow>
      {allocations.map((a) => (
        <TableRow key={a.id} className="text-muted-foreground">
          <TableCell className="pl-8">{a.label}</TableCell>
          <TableCell className="text-right tabular-nums">{a.periods}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
