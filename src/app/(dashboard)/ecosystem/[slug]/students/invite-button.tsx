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
import { CreateInvitationCodeForm } from "@/components/console/forms";
import type { InvitationSpace } from "@/components/console/forms";

export function InviteLearnersButton({
  spaces,
}: {
  spaces: InvitationSpace[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Invite learners</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite learners</DialogTitle>
          <DialogDescription>
            Generate an invitation code for learners to sign up. Optionally
            link the code to a grade so learners are enrolled automatically.
          </DialogDescription>
        </DialogHeader>
        <CreateInvitationCodeForm
          spaces={spaces}
          mode="learner"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
