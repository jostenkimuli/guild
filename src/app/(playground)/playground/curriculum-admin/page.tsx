import { Badge } from "@/components/ui/badge";
import { CurriculumAdminPreview } from "@/components/playground/curriculum-admin-preview";

export default function CurriculumAdminPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            National curriculum
          </h2>
          <Badge variant="secondary">Super admin · Cycle 1 definition</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The reference standard super admins maintain before any school
          implementation starts. Two structure types live here as separate
          tabs — the subject-based arm (national templates → subject syllabi)
          and the thematic P1–P3 curriculum. Both arms are organized around the
          four universal curriculum components — Intent, Content, Learning
          &amp; Teaching, and Assessment — with a completeness gauge per
          document. Fed from mock data in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            src/lib/playground/mock.ts
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            src/lib/playground/thematic-curriculum.ts
          </code>
          ; no actions wired yet — this is a design preview.
        </p>
      </section>

      <CurriculumAdminPreview />
    </div>
  );
}