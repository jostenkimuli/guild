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
import { CreateSpaceAdminForm } from "./forms";

export function CreateSpaceAdminDialog({
  ecosystemId,
}: {
  ecosystemId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Add space admin</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a space admin</DialogTitle>
          <DialogDescription>
            Space admins manage the spaces you create and generate invitation
            codes for them.
          </DialogDescription>
        </DialogHeader>
        <CreateSpaceAdminForm ecosystemId={ecosystemId} />
      </DialogContent>
    </Dialog>
  );
}