"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SyllabiSection } from "@/components/spaces/syllabi-section";
import { CurriculumDialog } from "@/components/console/curriculum-dialog";

type Membership = {
  user_id: string;
  role: string;
  profiles: { display_name: string | null; username: string | null } | null;
};

type CurriculumTreeEntry = {
  id: string;
  name: string;
  year: number;
  is_published: boolean | null;
  grades: { id: string; name: string; terms: { id: string }[] | null }[] | null;
};

type SyllabiRow = {
  id: string;
  curriculum_id: string;
  curricula: { name: string; year: number } | null;
  grading_policy: {
    pass_mark?: number;
    grade_breakdown: { label: string; weight_pct: number }[];
  } | null;
  required_materials: string | null;
  office_hours: string | null;
  classroom_expectations: string | null;
};

export function SpaceTabs({
  spaceId,
  memberships,
  curricula,
  staffSyllabi,
  isStaff,
  isEcosystemAdmin,
}: {
  spaceId: string;
  memberships: Membership[];
  curricula: CurriculumTreeEntry[];
  staffSyllabi: SyllabiRow[];
  isStaff: boolean;
  isEcosystemAdmin: boolean;
}) {
  const tabs = [
    { value: "members", label: "Members" },
    ...(isStaff ? [{ value: "syllabi", label: "Syllabi" }] : []),
    ...(isEcosystemAdmin ? [{ value: "curriculum", label: "Curriculum" }] : []),
  ];

  return (
    <Tabs defaultValue="members">
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Members */}
      <TabsContent value="members">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest">
          {memberships.length > 0 ? (
            <ul className="divide-y divide-outline-variant">
              {memberships.map((m) => (
                <li
                  key={`${m.user_id}-${m.role}`}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-on-surface">
                    {m.profiles?.display_name ?? m.profiles?.username ?? "Member"}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {m.role}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-on-surface-variant">No members yet.</p>
          )}
        </div>
      </TabsContent>

      {/* Syllabi */}
      {isStaff && (
        <TabsContent value="syllabi">
          <SyllabiSection curricula={curricula} syllabiRows={staffSyllabi} />
        </TabsContent>
      )}

      {/* Curriculum */}
      {isEcosystemAdmin && (
        <TabsContent value="curriculum">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                {curricula.length} curriculum{curricula.length !== 1 ? "s" : ""}
              </p>
              <CurriculumDialog
                space={{ id: spaceId }}
                curricula={curricula.map((c) => ({ id: c.id, name: c.name, year: c.year }))}
              />
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest">
              {curricula.length > 0 ? (
                <ul className="divide-y divide-outline-variant">
                  {curricula.map((c) => (
                    <li key={c.id} className="space-y-1 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-on-surface">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.is_published ? "secondary" : "outline"}>
                            {c.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline">Year {c.year}</Badge>
                        </div>
                      </div>
                      {c.grades?.length ? (
                        <p className="text-xs text-on-surface-variant">
                          {c.grades.length} grade{c.grades.length !== 1 ? "s" : ""} ·{" "}
                          {c.grades.map((g) => g.name).join(", ")}
                        </p>
                      ) : (
                        <p className="text-xs text-on-surface-variant">No grades yet.</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-sm text-on-surface-variant">
                  No curriculum yet. Use &quot;Manage curriculum data&quot; to create one.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
