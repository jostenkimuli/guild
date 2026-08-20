"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, Feedback } from "./forms";
import { editSpace } from "@/app/actions/console";
import { SPACE_TYPE_LABELS, spaceTypeLabel } from "@/lib/ecosystems";

export type SpaceSummary = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  slug: string | null;
};

export function SpaceCard({
  space,
}: {
  space: SpaceSummary;
}) {
  const [editState, editFormAction, editPending] = useActionState(editSpace, {
    success: false,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{space.name}</CardTitle>
            {space.description ? (
              <CardDescription className="mt-1">
                {space.description}
              </CardDescription>
            ) : null}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {spaceTypeLabel(space.type)}
          </Badge>
        </div>
      </CardHeader>
      {/* Space edit request for space admins */}
      <CardContent className="mt-2">
        <form action={editFormAction} className="space-y-2">
          <input type="hidden" name="space_id" value={space.id} />
          <Field id="edit-name" label="Name">
            <Input
              id="edit-name"
              name="name"
              value={space.name}
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
              {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Feedback state={editState} />
          <Button type="submit" disabled={editPending}>
            Request space edit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
