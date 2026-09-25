"use client";

import { useEffect, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import {
  deleteAim,
  deleteAreaUnit,
  deletePeriodAllocation,
  deleteRule,
  deleteStrand,
  saveNationalCurriculum,
} from "@/app/actions/national-curriculum-admin";
import {
  AimDialog,
  AllocationDialog,
  AreaUnitDialog,
  RuleDialog,
  StrandDialog,
} from "@/components/admin-curriculum/entity-dialogs";
import { DeleteButton } from "@/components/admin-curriculum/delete-button";
import { TreeTab } from "@/components/admin-curriculum/tree-tab";
import { ConsolePanel, EmptyState } from "@/components/console/panels";
import { selectClass } from "@/components/curriculum/form-styles";
import { RequirementBadge } from "@/components/curriculum/requirement-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ECOSYSTEM_TYPE_LABELS } from "@/lib/ecosystems";
import type { NationalCurriculum } from "@/lib/curriculum/national";

export function CurriculumEditor({ curriculum }: { curriculum: NationalCurriculum }) {
  const total = curriculum.allocations.reduce((sum, a) => sum + a.periods, 0);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{curriculum.title}</h2>
          <Badge variant="secondary">{curriculum.class_level}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {curriculum.authority} &middot; {curriculum.edition} &middot; slug{" "}
          <code className="text-xs">{curriculum.slug}</code>
        </p>
      </div>

      <Tabs defaultValue="tree">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="tree">Curriculum tree</TabsTrigger>
          <TabsTrigger value="strands">Learning areas</TabsTrigger>
          <TabsTrigger value="aims">Aims</TabsTrigger>
          <TabsTrigger value="allocations">Weekly periods ({total})</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="area-units">Area units</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="pt-3">
          <TreeTab curriculum={curriculum} />
        </TabsContent>

        <TabsContent value="strands" className="pt-3">
          <StrandsTab curriculum={curriculum} />
        </TabsContent>

        <TabsContent value="aims" className="pt-3">
          <AimsTab curriculum={curriculum} />
        </TabsContent>

        <TabsContent value="allocations" className="pt-3">
          <AllocationsTab curriculum={curriculum} />
        </TabsContent>

        <TabsContent value="rules" className="pt-3">
          <RulesTab curriculum={curriculum} />
        </TabsContent>

        <TabsContent value="area-units" className="pt-3">
          <AreaUnitsTab curriculum={curriculum} />
        </TabsContent>

        <TabsContent value="overview" className="pt-3">
          <OverviewTab curriculum={curriculum} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StrandsTab({ curriculum }: { curriculum: NationalCurriculum }) {
  return (
    <ConsolePanel
      title="Learning areas"
      description="The subjects/strands a competence can belong to. Uncheck 'runs through every theme' for a subject that has its own schedule, e.g. Religious Education or PE."
      footer={
        <StrandDialog
          curriculumId={curriculum.id}
          trigger={
            <Button size="sm" variant="outline">
              <PlusIcon className="size-4" /> Add learning area
            </Button>
          }
        />
      }
    >
      {curriculum.strands.length === 0 ? (
        <EmptyState>No learning areas yet.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Thematic</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {curriculum.strands.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.key}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.is_thematic ? "Yes" : "No — own schedule"}</TableCell>
                <TableCell className="text-right">
                  <StrandDialog
                    curriculumId={curriculum.id}
                    strand={s}
                    trigger={<Button size="sm" variant="ghost">Edit</Button>}
                  />
                  <DeleteButton
                    action={deleteStrand}
                    fields={{ id: s.id, national_curriculum_id: curriculum.id }}
                    confirmMessage={`Delete "${s.name}"? Competences and rows using it will also be affected.`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ConsolePanel>
  );
}

function AimsTab({ curriculum }: { curriculum: NationalCurriculum }) {
  const national = curriculum.aims.filter((a) => a.kind === "national");
  const primary = curriculum.aims.filter((a) => a.kind === "primary");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(
        [
          ["National aims of education", national, "national"],
          ["Aims of this level", primary, "primary"],
        ] as const
      ).map(([title, aims, kind]) => (
        <ConsolePanel
          key={kind}
          title={title}
          footer={
            <AimDialog
              curriculumId={curriculum.id}
              defaultKind={kind}
              trigger={
                <Button size="sm" variant="outline">
                  <PlusIcon className="size-4" /> Add aim
                </Button>
              }
            />
          }
        >
          {aims.length === 0 ? (
            <EmptyState>None yet.</EmptyState>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {aims
                .sort((a, b) => a.position - b.position)
                .map((aim) => (
                  <li key={aim.id} className="flex items-start justify-between gap-2">
                    <span>{aim.description}</span>
                    <span className="flex shrink-0 gap-1">
                      <AimDialog
                        curriculumId={curriculum.id}
                        aim={aim}
                        trigger={<Button size="sm" variant="ghost">Edit</Button>}
                      />
                      <DeleteButton
                        action={deleteAim}
                        fields={{ id: aim.id, national_curriculum_id: curriculum.id }}
                      />
                    </span>
                  </li>
                ))}
            </ol>
          )}
        </ConsolePanel>
      ))}
    </div>
  );
}

function AllocationsTab({ curriculum }: { curriculum: NationalCurriculum }) {
  const total = curriculum.allocations.reduce((sum, a) => sum + a.periods, 0);
  return (
    <ConsolePanel
      title="Weekly period allocation"
      description={`Currently totals ${total} periods a week. Leave "block size" at 1 for a normal single lesson; set it to 2 for a double lesson. "Follows key" forces one lesson to sit directly after another, e.g. Literacy II after Literacy I.`}
      footer={
        <AllocationDialog
          curriculumId={curriculum.id}
          trigger={
            <Button size="sm" variant="outline">
              <PlusIcon className="size-4" /> Add weekly period
            </Button>
          }
        />
      }
    >
      {curriculum.allocations.length === 0 ? (
        <EmptyState>No weekly periods defined — this level may not use a fixed timetable.</EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Periods</TableHead>
              <TableHead className="text-right">Block</TableHead>
              <TableHead>Follows</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {curriculum.allocations.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.label}</TableCell>
                <TableCell className="text-muted-foreground">{a.group_label ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{a.periods}</TableCell>
                <TableCell className="text-right tabular-nums">{a.block_size}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.follows_key ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <AllocationDialog
                    curriculumId={curriculum.id}
                    allocation={a}
                    trigger={<Button size="sm" variant="ghost">Edit</Button>}
                  />
                  <DeleteButton
                    action={deletePeriodAllocation}
                    fields={{ id: a.id, national_curriculum_id: curriculum.id }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ConsolePanel>
  );
}

function RulesTab({ curriculum }: { curriculum: NationalCurriculum }) {
  return (
    <ConsolePanel
      title="Rules"
      description="Language, timetable, assessment and teaching rules — shown next to the weekly period table and in the school decisions form."
      footer={
        <RuleDialog
          curriculumId={curriculum.id}
          trigger={
            <Button size="sm" variant="outline">
              <PlusIcon className="size-4" /> Add rule
            </Button>
          }
        />
      }
    >
      {curriculum.rules.length === 0 ? (
        <EmptyState>No rules yet.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {curriculum.rules.map((rule) => (
            <li key={rule.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{rule.rule_group}</Badge>
                  <RequirementBadge level={rule.requirement_level} />
                </div>
                <p className="text-sm">{rule.description}</p>
              </div>
              <span className="flex shrink-0 gap-1">
                <RuleDialog
                  curriculumId={curriculum.id}
                  rule={rule}
                  trigger={<Button size="sm" variant="ghost">Edit</Button>}
                />
                <DeleteButton action={deleteRule} fields={{ id: rule.id, national_curriculum_id: curriculum.id }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </ConsolePanel>
  );
}

function AreaUnitsTab({ curriculum }: { curriculum: NationalCurriculum }) {
  const areaStrandsList = curriculum.strands.filter((s) => !s.is_thematic);
  return (
    <ConsolePanel
      title="Area units"
      description="Weekly units for subjects that run on their own schedule outside the theme tree, e.g. Religious Education or Physical Education."
      footer={
        areaStrandsList.length > 0 ? (
          <AreaUnitDialog
            curriculumId={curriculum.id}
            strands={areaStrandsList}
            trigger={
              <Button size="sm" variant="outline">
                <PlusIcon className="size-4" /> Add unit
              </Button>
            }
          />
        ) : null
      }
    >
      {areaStrandsList.length === 0 ? (
        <EmptyState>
          Mark a learning area as &ldquo;not thematic&rdquo; on the Learning areas tab first.
        </EmptyState>
      ) : curriculum.areaUnits.length === 0 ? (
        <EmptyState>No units yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {areaStrandsList.map((strand) => {
            const units = curriculum.areaUnits.filter((u) => u.strand_id === strand.id);
            if (units.length === 0) return null;
            return (
              <div key={strand.id}>
                <p className="text-sm font-medium">{strand.name}</p>
                <ul className="mt-1 divide-y rounded-lg border">
                  {units.map((u) => (
                    <li key={u.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Term {u.term_no} &middot; {u.weeks_label}
                        </span>
                        <p className="font-medium">{u.title}</p>
                        {u.learning_outcome ? (
                          <p className="text-muted-foreground">{u.learning_outcome}</p>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 gap-1">
                        <AreaUnitDialog
                          curriculumId={curriculum.id}
                          strands={areaStrandsList}
                          unit={u}
                          trigger={<Button size="sm" variant="ghost">Edit</Button>}
                        />
                        <DeleteButton
                          action={deleteAreaUnit}
                          fields={{ id: u.id, national_curriculum_id: curriculum.id }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </ConsolePanel>
  );
}

function OverviewTab({ curriculum }: { curriculum: NationalCurriculum }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveNationalCurriculum, { success: false });
  const handled = useRef(false);

  useEffect(() => {
    if (state.success && !handled.current) {
      handled.current = true;
      router.refresh();
    }
  }, [state, router]);

  return (
    <ConsolePanel title="Curriculum details">
      <form action={formAction} className="max-w-xl space-y-4">
        <input type="hidden" name="id" value={curriculum.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={curriculum.slug} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="class_level">Class level (e.g. P1)</Label>
            <Input id="class_level" name="class_level" defaultValue={curriculum.class_level} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={curriculum.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="authority">Authority</Label>
          <Input id="authority" name="authority" defaultValue={curriculum.authority} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cycle_label">Cycle label</Label>
            <Input id="cycle_label" name="cycle_label" defaultValue={curriculum.cycle_label} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edition">Edition</Label>
            <Input id="edition" name="edition" defaultValue={curriculum.edition} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ecosystem_type">School type this applies to</Label>
          <select id="ecosystem_type" name="ecosystem_type" className={selectClass} defaultValue="primary_school">
            {Object.entries(ECOSYSTEM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source_url">Source URL</Label>
          <Input id="source_url" name="source_url" type="url" defaultValue={curriculum.source_url ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orientation_terms">Orientation terms (comma-separated, e.g. 1)</Label>
          <Input
            id="orientation_terms"
            name="orientation_terms"
            defaultValue={curriculum.orientation_terms.join(", ")}
          />
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </form>
    </ConsolePanel>
  );
}
