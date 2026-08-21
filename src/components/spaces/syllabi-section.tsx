"use client";

import * as React from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SyllabusDialog } from "./syllabus-dialog";

type SyllabusRow = {
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

interface SyllabiSectionProps {
  curricula: { id: string; name: string; year: number }[];
  syllabiRows: SyllabusRow[];
}

export function SyllabiSection({
  curricula,
  syllabiRows,
}: SyllabiSectionProps) {
  const [openSyllabus, setOpenSyllabus] = React.useState(false);
  const [editRow, setEditRow] = React.useState<SyllabusRow | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Refresh parent page data when dialog opens/closes
    if (openSyllabus || editRow) {
      router.refresh();
    }
  }, [openSyllabus, editRow, router]);

  const handleCreate = () => setOpenSyllabus(true);
  const handleEdit = (row: SyllabusRow) => {
    setEditRow(row);
    setOpenSyllabus(true);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Syllabi</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {syllabiRows.length > 0 ? (
            <ul className="divide-y">
              {syllabiRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm font-medium">
                      {row.curricula?.name ?? "Unknown curriculum"}
                    </span>
                    {row.curricula && <Badge>{`Year ${row.curricula.year}`}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(row)}
                    >
                      Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No syllabi yet.</p>
          )}
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <Button onClick={handleCreate} className="gap-1">
            <span className="material-symbols-outlined">
              add
            </span>
            Create new Syllabus
          </Button>
        </CardFooter>
      </Card>

      <SyllabusDialog
        isOpen={openSyllabus}
        onOpenChange={setOpenSyllabus}
        curricula={curricula}
        existing={editRow ? {
          curriculum_id: editRow.curriculum_id,
          grading_policy: editRow.grading_policy,
          required_materials: editRow.required_materials?.split("\n") || [],
          office_hours: editRow.office_hours,
          classroom_expectations: editRow.classroom_expectations,
        } : null}
      />
    </div>
  );
}