"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AdminActionState } from "@/app/actions/national-curriculum-admin";

export function DeleteButton({
  action,
  fields,
  confirmMessage,
  label = "Delete",
  className,
}: {
  action: (formData: FormData) => Promise<AdminActionState>;
  fields: Record<string, string>;
  confirmMessage?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(fields)) formData.set(key, value);
      const result = await action(formData);
      if (result.success) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not delete.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className={className}
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? "…" : label}
    </Button>
  );
}
