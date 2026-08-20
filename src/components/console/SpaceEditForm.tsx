"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, Feedback } from "@/components/console/forms";
import { editSpace } from "@/app/actions/console";

export type SpaceEditRequest = {
  id: string;
  status?: string;
  created_at: string;
  changes: unknown;
};

export function SpaceEditForm({
  space,
  latestEdit,
}: {
  space: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
  };
  latestEdit: SpaceEditRequest | null;
}) {
  const [state, formAction, pending] = useActionState(editSpace, {
    success: false,
  });

  if (state.success && state.request) {
    return <PendingRequestCard request={state.request} />;
  }

  if (latestEdit && latestEdit.status === "pending") {
    return <PendingRequestCard request={latestEdit} />;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Request space edit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="space_id" value={space.id} />
          <Field id="edit-name" label="Name">
            <Input
              id="edit-name"
              name="name"
              defaultValue={space.name}
              minLength={2}
              maxLength={120}
            />
          </Field>
          <Field id="edit-slug" label="Slug">
            <Input
              id="edit-slug"
              name="slug"
              maxLength={60}
              pattern="[a-z0-9][a-z0-9-]*"
              placeholder={space.slug ?? "my-department"}
            />
          </Field>
          <Field id="edit-description" label="Description">
            <Textarea
              id="edit-description"
              name="description"
              maxLength={1000}
            />
          </Field>
          <Field id="edit-type" label="Type">
            <select
              id="edit-type"
              name="type"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="department">Department</option>
              <option value="innovation_hub">Innovation hub</option>
              <option value="project_group">Project group</option>
            </select>
          </Field>
          <Feedback state={state} />
          <Button type="submit" disabled={pending}>
            Request space edit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PendingRequestCard({ request }: { request: SpaceEditRequest }) {
  const changes = request.changes as Record<string, unknown>;
  const requestedFields = Object.entries(changes).filter(
    ([, value]) => typeof value === "string" && value.length > 0,
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">
            Edit request pending
          </CardTitle>
          <Badge variant="secondary">Pending approval</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Your request to update this space was submitted on{" "}
          {formatDate(request.created_at)} and is awaiting ecosystem admin
          approval.
        </p>
        {requestedFields.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Requested changes
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {requestedFields.map(([field, value]) => (
                <li key={field}>
                  <span className="font-medium capitalize">{field}:</span>{" "}
                  {String(value)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
