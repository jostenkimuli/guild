"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateSpaceForm } from "./forms";
import { spaceTypeLabel, type SpaceType } from "@/lib/ecosystems";

export function CreateSpaceDialog({
  ecosystemId,
  defaultType = "department",
  triggerLabel,
}: {
  ecosystemId: string;
  defaultType?: SpaceType;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = spaceTypeLabel(defaultType).toLowerCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {triggerLabel ?? `Create ${label} space`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create {label} space</DialogTitle>
          <DialogDescription>
            Add a new {label} space to your ecosystem.
          </DialogDescription>
        </DialogHeader>
        <CreateSpaceForm ecosystemId={ecosystemId} defaultType={defaultType} />
      </DialogContent>
    </Dialog>
  );
}
