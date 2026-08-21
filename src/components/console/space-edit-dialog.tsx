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
import { SpaceEditForm, type SpaceEditRequest } from "./SpaceEditForm";

export function SpaceEditDialog({
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
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Request space edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request space edit</DialogTitle>
          <DialogDescription>
            Propose changes to this space for ecosystem admin approval.
          </DialogDescription>
        </DialogHeader>
        <SpaceEditForm
          space={space}
          latestEdit={latestEdit}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}