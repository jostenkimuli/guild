"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreateSpaceForm } from "./forms";
import { spaceTypeLabel, type SpaceType } from "@/lib/ecosystems";

export function CreateSpaceButton({
  ecosystemId,
  defaultType = "department",
}: {
  ecosystemId: string;
  defaultType?: SpaceType;
}) {
  const [open, setOpen] = useState(false);
  const label = spaceTypeLabel(defaultType).toLowerCase();

  return (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      <Button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "Cancel" : `Create ${label} space`}
      </Button>
      {open ? (
        <CreateSpaceForm ecosystemId={ecosystemId} defaultType={defaultType} />
      ) : null}
    </div>
  );
}
