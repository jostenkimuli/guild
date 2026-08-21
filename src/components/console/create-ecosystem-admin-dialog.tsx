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
import { CreateEcosystemAdminForm } from "./forms";

export function CreateEcosystemAdminDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Create ecosystem admin</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an ecosystem admin</DialogTitle>
          <DialogDescription>
            The account starts as pending. Approval is decided by the super
            admin, or by the program admin if the super admin has delegated
            approval to them.
          </DialogDescription>
        </DialogHeader>
        <CreateEcosystemAdminForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}