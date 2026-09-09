"use client";

import { useEffect, useState } from "react";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeModal } from "@/components/ecosystem/theme-modal";
import { ecosystemTypeLabel } from "@/lib/ecosystems";

type SchoolEcosystem = {
  id: string;
  slug: string;
  name: string;
  type: string;
  vision: string | null;
  mission: string | null;
  badge_url: string | null;
  theme_primary: string | null;
  theme_supporting: string | null;
  theme_accent: string | null;
};

export function SchoolDashboard({ ecosystem }: { ecosystem: SchoolEcosystem }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [students, setStudents] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<number | null>(null);
  const [classes, setClasses] = useState<number | null>(null);

  useEffect(() => {
    const sb = createBrowserClient();
    async function load() {
      const [studentCount, teacherCount, classCount] = await Promise.all([
        sb
          .from("space_memberships")
          .select("id", { count: "exact", head: true })
          .eq("spaces.ecosystem_id", ecosystem.id)
          .eq("role", "learner"),
        sb
          .from("space_memberships")
          .select("id", { count: "exact", head: true })
          .eq("spaces.ecosystem_id", ecosystem.id)
          .eq("role", "teacher"),
        sb
          .from("spaces")
          .select("id", { count: "exact", head: true })
          .eq("ecosystem_id", ecosystem.id),
      ]);
      setStudents(studentCount.count ?? 0);
      setTeachers(teacherCount.count ?? 0);
      setClasses(classCount.count ?? 0);
    }
    load();
  }, [ecosystem.id]);

  const stats = [
    {
      label: "Students",
      value: students,
      description: "Enrolled learners across all classes",
    },
    {
      label: "Teachers",
      value: teachers,
      description: "Active teaching staff",
    },
    {
      label: "Classes",
      value: classes,
      description: "Active classes in this school",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {ecosystem.name}
            </h2>
            <Badge variant="secondary">
              {ecosystemTypeLabel(ecosystem.type)}
            </Badge>
          </div>
          {ecosystem.vision ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {ecosystem.vision}
            </p>
          ) : null}
        </div>
        <Button
          size="sm"
          onClick={() => setThemeOpen(true)}
        >
          Theme &amp; Branding
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stat.value === null ? (
                  <span className="inline-block size-5 animate-pulse rounded bg-muted" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>

      {/* Theme modal */}
      <ThemeModal
        ecosystem={ecosystem}
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
      />
    </div>
  );
}