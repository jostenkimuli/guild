"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import {
  adoptNationalCurriculum,
  setAdoptionNotify,
} from "@/app/actions/implementation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdoptionCard({
  ecosystemId,
  ecosystemSlug,
  curriculum,
  schoolName,
  adoption,
}: {
  ecosystemId: string;
  ecosystemSlug: string;
  curriculum: {
    id: string;
    slug: string;
    title: string;
    authority: string;
    edition: string;
    sourceUrl: string | null;
  };
  schoolName: string;
  adoption: { adoptedOn: string; notifyOnChange: boolean } | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(adoptNationalCurriculum, {
    success: false,
  });
  const [notify, setNotify] = useState(adoption?.notifyOnChange ?? false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  function toggleNotify(next: boolean) {
    setNotify(next);
    setNotifyError(null);
    startTransition(async () => {
      const result = await setAdoptionNotify(ecosystemId, curriculum.id, next);
      if (!result.success) {
        setNotify(!next);
        setNotifyError(result.error ?? "Could not save.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Official document
        </p>
        <CardTitle className="text-lg">{curriculum.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Issued by {curriculum.authority}. Edition: {curriculum.edition}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {adoption ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
              Adopted by {schoolName}
            </Badge>
            <span className="text-sm text-muted-foreground">on {adoption.adoptedOn}</span>
            <Button asChild size="sm">
              <Link href={`/ecosystem/${ecosystemSlug}/implementation?class=${curriculum.slug}`}>
                Plan your school&apos;s implementation
              </Link>
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="ecosystem_id" value={ecosystemId} />
            <input type="hidden" name="national_curriculum_id" value={curriculum.id} />
            <p className="text-sm text-muted-foreground">
              Adopting tells the system that your school follows this curriculum. You can
              then plan how your school will teach it.
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Adopting…" : "Adopt for our school"}
            </Button>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          </form>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3">
          {adoption ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={notify}
                onChange={(e) => toggleNotify(e.target.checked)}
              />
              Notify me if NCDC publishes a change
            </label>
          ) : null}
          {curriculum.sourceUrl ? (
            <a
              href={curriculum.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
            >
              NCDC website
            </a>
          ) : null}
        </div>
        {notifyError ? <p className="text-sm text-destructive">{notifyError}</p> : null}
      </CardContent>
    </Card>
  );
}
