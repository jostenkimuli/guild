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
import { type SpaceType } from "@/lib/ecosystems";

export function CreateSpaceDialog({
  ecosystemId,
  defaultType = "department",
}: {
  ecosystemId: string;
  defaultType?: SpaceType;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">Create space</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a space</DialogTitle>
          <DialogDescription>
            Spaces are departments, innovation hubs or project groups inside
            your ecosystem. Space admins manage them day-to-day.
          </DialogDescription>
        </DialogHeader>
        <CreateSpaceForm
          ecosystemId={ecosystemId}
          defaultType={defaultType}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
