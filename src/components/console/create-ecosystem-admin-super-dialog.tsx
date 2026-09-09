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

export function CreateEcosystemAdminBySuperAdminDialog() {
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
            The account is approved immediately — created by the super admin,
            so it can sign in and create its ecosystem right away.
          </DialogDescription>
        </DialogHeader>
        <CreateEcosystemAdminForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
