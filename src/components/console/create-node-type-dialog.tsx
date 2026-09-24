"use client";

import { useEffect, useActionState, useState } from "react";
import type { ReactNode } from "react";

import { createNodeType } from "@/app/actions/console";
import type {
  CreateNodeTypeState,
  NodeTypeOption,
} from "@/app/actions/console";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type NodeTypeCategory = "ORGANIZATIONAL" | "EDUCATIONAL";

const NODE_TYPE_CATEGORY_LABELS: Record<NodeTypeCategory, string> = {
  ORGANIZATIONAL: "Organizational (community)",
  EDUCATIONAL: "Educational",
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function CreateNodeTypeForm({
  defaultCategory,
  onDone,
}: {
  defaultCategory: NodeTypeCategory;
  onDone: (nodeType: NodeTypeOption) => void;
}) {
  const [state, formAction, pending] = useActionState<CreateNodeTypeState, FormData>(
    createNodeType,
    { success: false },
  );

  useEffect(() => {
    if (state.success && state.nodeType) {
      onDone(state.nodeType);
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nt-name">Type name</Label>
        <Input
          id="nt-name"
          name="type_name"
          required
          minLength={1}
          maxLength={50}
          placeholder="e.g. District"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nt-category">Category</Label>
        <select
          id="nt-category"
          name="category"
          className={selectClass}
          defaultValue={defaultCategory}
        >
          {(
            Object.entries(NODE_TYPE_CATEGORY_LABELS) as [
              NodeTypeCategory,
              string,
            ][]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Create type"}
      </Button>
    </form>
  );
}

/**
 * Modal for adding a row to node_types (the universal registry).
 * Works both as a plain button-triggered dialog and as a fully
 * controlled dialog (open + onOpenChange), e.g. when the "Add new
 * type" item in the ecosystem-type dropdown selects it.
 */
export function CreateNodeTypeDialog({
  open,
  onOpenChange,
  defaultCategory = "ORGANIZATIONAL",
  onCreated,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultCategory?: NodeTypeCategory;
  onCreated?: (nodeType: NodeTypeOption) => void;
  trigger?: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = (value: boolean) => {
    if (isControlled) onOpenChange?.(value);
    else setInternalOpen(value);
  };

  const handleDone = (nodeType: NodeTypeOption) => {
    onCreated?.(nodeType);
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a node type</DialogTitle>
          <DialogDescription>
            A community or educational node type in the universal registry.
          </DialogDescription>
        </DialogHeader>
        <CreateNodeTypeForm
          defaultCategory={defaultCategory}
          onDone={handleDone}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Convenience button that owns the dialog's open state. */
export function CreateNodeTypeButton({
  defaultCategory = "ORGANIZATIONAL",
  label = "Add node type",
  onCreated,
}: {
  defaultCategory?: NodeTypeCategory;
  label?: string;
  onCreated?: (nodeType: NodeTypeOption) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <CreateNodeTypeDialog
      open={open}
      onOpenChange={setOpen}
      defaultCategory={defaultCategory}
      onCreated={onCreated}
      trigger={<Button type="button">{label}</Button>}
    />
  );
}