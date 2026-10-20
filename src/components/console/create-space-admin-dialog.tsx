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
  spaces,
}: {
  ecosystemId: string;
  spaces: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">Add space admin</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a space admin</DialogTitle>
          <DialogDescription>
            Choose the first space this admin will manage. You can assign more
            spaces or change their assignments later.
          </DialogDescription>
        </DialogHeader>
        <CreateSpaceAdminForm ecosystemId={ecosystemId} spaces={spaces} />
      </DialogContent>
    </Dialog>
  );
}
