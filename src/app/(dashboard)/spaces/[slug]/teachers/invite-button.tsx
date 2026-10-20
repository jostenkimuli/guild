"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateInvitationCodeForm } from "@/components/console/forms";

export function InviteTeachersButton({
  spaceId,
  spaceName,
}: {
  spaceId: string;
  spaceName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        Invite teacher
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teacher</DialogTitle>
          <DialogDescription>
            Generate an invitation code for a teacher to join {spaceName}.
          </DialogDescription>
        </DialogHeader>
        <CreateInvitationCodeForm
          spaces={[{ id: spaceId, name: spaceName, grades: [] }]}
          mode="teacher"
          defaultSpaceId={spaceId}
        />
      </DialogContent>
    </Dialog>
  );
}
