import { Badge } from "@/components/ui/badge";
import { SchoolCurriculumDashboard } from "@/components/playground/school-curriculum-dashboard";

export default function SchoolDashboardPreviewPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            School administration
          </h2>
          <p className="text-sm text-muted-foreground">
            National curriculum implementation dashboard for an ecosystem
            school administrator, framed by the school&apos;s active standard
            subscriptions and switching between termly term snapshots.
          </p>
        </div>
        <Badge variant="outline">mock data · pending integration</Badge>
      </div>
      <SchoolCurriculumDashboard />
    </div>
  );
}