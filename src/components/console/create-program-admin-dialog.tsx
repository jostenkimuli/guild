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
import { CreateProgramAdminForm } from "./forms";

export function CreateProgramAdminDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Create program admin</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a program admin</DialogTitle>
          <DialogDescription>
            The account starts as pending and cannot create ecosystem admins
            until you approve it.
          </DialogDescription>
        </DialogHeader>
        <CreateProgramAdminForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}