"use client";

// Generic standards registry panel. Renders the schema-as-data world on
// top of the bespoke NCDC preview: a vocabulary of node types (each
// with its payload schema) and the standard documents they own,
// measured against the four universal components via each root
// document's own `component_manifest`.
//
// Every mutation delegates to the server actions and then calls
// `router.refresh()` so the panel always reflects the database.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FilePlus2Icon,
  FileTextIcon,
  PenSquareIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import {
  createStandardDocument,
  createStandardNode,
  defineStandardType,
  deleteStandardNode,
  deleteStandardType,
  saveStandardNode,
  setStandardNodeStatus,
  updateStandardType,
  type StandardRegistryActionResult,
} from "@/app/actions/standard-registry";
import {
  computeComponentCoverage,
  componentCoverageCount,
  childrenOf,
  findRootDocuments,
  type NodeTypeDescriptor,
  type SpineNode,
  type StandardStatus,
} from "@/lib/curriculum-spine/registry";
import type { ComponentManifest } from "@/lib/curriculum-spine/manifest";
import { JsonSchemaForm } from "@/components/admin/curriculum/json-schema-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const STATUS_VARIANT: Record<StandardStatus, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

type ActionResult = StandardRegistryActionResult;

function useAction() {
  const router = useRouter();
  const [pending] = useTransition();
  const run = async (
    action: () => Promise<ActionResult>,
    successMessage = "Saved.",
  ): Promise<number | undefined> => {
    const result = await action();
    if (!result.success) {
      if (result.error) toast.error(result.error);
      return undefined;
    }
    toast.success(successMessage);
    router.refresh();
    return result.id ?? undefined;
  };
  return { run, pending };
}

// ------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------

function RawJsonEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  return (
    <Textarea
      className="h-64 font-mono text-xs leading-relaxed"
      value={text}
      placeholder="No schema registered - edit the payload as JSON (commits when valid)."
      onChange={(event) => {
        setText(event.target.value);
        try {
          const parsed: unknown = JSON.parse(event.target.value);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            onChange(parsed as Record<string, unknown>);
          }
        } catch {
          // hold text until valid
        }
      }}
    />
  );
}

function StatusPill({ status }: { status: StandardStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {status === "draft" ? "draft" : status === "published" ? "published" : "archived"}
    </Badge>
  );
}

// ------------------------------------------------------------
// Define / edit standard type dialogs
// ------------------------------------------------------------

function TypeSchemaEditor({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial: NodeTypeDescriptor | null;
}) {
  const { run, pending } = useAction();
  const isEdit = initial !== null;

  const [typeName, setTypeName] = useState(initial?.typeName ?? "");
  const [isRoot, setIsRoot] = useState(initial?.isRoot ?? false);
  const [allowedChildren, setAllowedChildren] = useState(
    initial?.allowedChildren?.join(", ") ?? "",
  );
  const [schemaText, setSchemaText] = useState(
    initial && initial.payloadSchema
      ? JSON.stringify(initial.payloadSchema, null, 2)
      : "",
  );

  const onSave = async () => {
    const parsed = schemaText.trim() ? JSON.parse(schemaText) : undefined;
    if (!isEdit) {
      const result = await run(
        () =>
          defineStandardType({
            typeName,
            isRoot,
            allowedChildren: allowedChildren
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            payloadSchema: parsed,
          }),
        "Standard type defined.",
      );
      if (result !== undefined) onClose();
      return;
    }
    const result = await run(
      () =>
        updateStandardType({
          typeId: initial.typeId,
          isRoot,
          allowedChildren: allowedChildren
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          payloadSchema: parsed,
        }),
      "Standard type updated.",
    );
    if (result !== undefined) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit standard type" : "Define standard type"}
          </DialogTitle>
          <DialogDescription>
            Types are the vocabulary of a standard. Root types own the
            document; allowed children constrain the tree; the payload
            schema shapes every node&apos;s data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="type-name">Type name (snake_case)</Label>
              <Input
                id="type-name"
                value={typeName}
                disabled={isEdit}
                placeholder="occupation_framework"
                onChange={(event) => setTypeName(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Label htmlFor="is-root" className="flex items-center gap-2 text-sm">
                <input
                  id="is-root"
                  type="checkbox"
                  checked={isRoot}
                  onChange={(event) => setIsRoot(event.target.checked)}
                  className="size-4 cursor-pointer accent-foreground"
                />
                Root type
              </Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allowed-children">Allowed children (comma-separated type names)</Label>
            <Input
              id="allowed-children"
              value={allowedChildren}
              placeholder="learning_field, competence_area"
              onChange={(event) => setAllowedChildren(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payload-schema">Payload schema (JSON Schema, draft-7)</Label>
            <Textarea
              id="payload-schema"
              className="h-56 font-mono text-xs leading-relaxed"
              value={schemaText}
              placeholder={'{\n  "type": "object",\n  "required": ["code"],\n  "properties": { ... }\n}'}
              onChange={(event) => setSchemaText(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Advanced widgets: x-widget (textarea|json|checkbox), x-order, x-help, x-placeholder.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {isEdit ? "Update type" : "Define type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Node editor dialog (payload + identity)
// ------------------------------------------------------------

function NodeEditorDialog({
  node,
  type,
  onClose,
}: {
  node: SpineNode;
  type: NodeTypeDescriptor | undefined;
  onClose: () => void;
}) {
  const { run, pending } = useAction();
  const [title, setTitle] = useState(node.title);
  const [code, setCode] = useState(node.code ?? "");
  const [payload, setPayload] = useState<Record<string, unknown>>(
    (node.payload ?? {}) as Record<string, unknown>,
  );

  const onSave = async () => {
    const result = await run(
      () =>
        saveStandardNode({
          nodeId: node.id,
          title,
          code,
          payload,
        }),
      "Node saved.",
    );
    if (result !== undefined) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type?.typeName ?? "Node"}</DialogTitle>
          <DialogDescription>
            Identity plus the payload shaped by the registered schema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`node-title-${node.id}`}>Title</Label>
              <Input
                id={`node-title-${node.id}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`node-code-${node.id}`}>Code</Label>
              <Input
                id={`node-code-${node.id}`}
                value={code}
                placeholder="Optional"
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
          </div>
          {type?.payloadSchema ? (
            <div className="rounded-lg border p-3">
              <JsonSchemaForm
                schema={type.payloadSchema}
                value={payload}
                onChange={setPayload}
              />
            </div>
          ) : (
            <RawJsonEditor value={payload} onChange={setPayload} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            Save node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Add child dialog
// ------------------------------------------------------------

function AddChildDialog({
  parent,
  parentType,
  types,
  onClose,
}: {
  parent: SpineNode;
  parentType: NodeTypeDescriptor | undefined;
  types: NodeTypeDescriptor[];
  onClose: () => void;
}) {
  const { run, pending } = useAction();
  const allowed = parentType?.allowedChildren ?? null;
  const options = [
    ...types
      .filter(
        (t) => !t.isRoot && (allowed === null || allowed.includes(t.typeName)),
      )
      .sort((a, b) => a.typeName.localeCompare(b.typeName)),
  ];
  const [typeId, setTypeId] = useState<string>(
    options[0] ? String(options[0].typeId) : "",
  );
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");

  const onAdd = async () => {
    const result = await run(
      () =>
        createStandardNode({
          parentId: parent.id,
          typeId: Number(typeId),
          title,
          code: code || null,
        }),
      "Node created.",
    );
    if (result !== undefined) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add child under {parent.title}</DialogTitle>
          <DialogDescription>
            {parentType?.allowedChildren
              ? `Allowed: ${parentType.allowedChildren.join(", ")}`
              : "Any non-root type is allowed here."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="child-type">Node type</Label>
            <select
              id="child-type"
              className={selectClass}
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
            >
              {options.map((option) => (
                <option key={option.typeId} value={option.typeId}>
                  {option.typeName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-title">Title</Label>
            <Input
              id="child-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-code">Code (optional)</Label>
            <Input
              id="child-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAdd} disabled={pending || options.length === 0}>
            Create node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Create document dialog
// ------------------------------------------------------------

function CreateDocumentDialog({
  types,
  onClose,
}: {
  types: NodeTypeDescriptor[];
  onClose: () => void;
}) {
  const { run, pending } = useAction();
  const roots = types.filter((t) => t.isRoot);
  const [typeId, setTypeId] = useState<string>(
    roots[0] ? String(roots[0].typeId) : "",
  );
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");

  const onAdd = async () => {
    const result = await run(
      () =>
        createStandardDocument({ typeId: Number(typeId), title, code }),
      "Document created.",
    );
    if (result !== undefined) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New standard document</DialogTitle>
          <DialogDescription>
            A root document carries a component_manifest &mdash; the four-component statement every standard must answer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Root type</Label>
            <select
              id="doc-type"
              className={selectClass}
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
            >
              {roots.map((option) => (
                <option key={option.typeId} value={option.typeId}>
                  {option.typeName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              placeholder="KFZ-Mechatroniker"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-code">Code</Label>
            <Input
              id="doc-code"
              value={code}
              placeholder="KFZ-MECH-2020"
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAdd} disabled={pending || roots.length === 0}>
            Create document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Node tree
// ------------------------------------------------------------

function TreeNode({
  node,
  nodes,
  types,
  depth,
}: {
  node: SpineNode;
  nodes: SpineNode[];
  types: NodeTypeDescriptor[];
  depth: number;
}) {
  const { run } = useAction();
  const [open, setOpen] = useState(depth < 2);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const type = types.find((t) => t.typeId === node.typeId);
  const children = childrenOf(nodes, node.id);

  const changeStatus = async (next: StandardStatus) => {
    if (next === node.status) return;
    await run(
      () => setStandardNodeStatus(node.id, next),
      `Status set to ${next}.`,
    );
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete "${node.title}" and all its descendants?`)) return;
    const result = await run(() => deleteStandardNode(node.id), "Node deleted.");
    if (result !== undefined) setOpen(false);
  };

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-muted/60"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-muted-foreground transition-transform"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{node.title}</p>
          {node.code ? <p className="truncate font-mono text-xs text-muted-foreground">{node.code}</p> : null}
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {type?.typeName ?? "unknown"}
        </Badge>
        <StatusPill status={node.status} />
        <div className="flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            aria-label="Edit node"
          >
            <PenSquareIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setAddOpen(true)}
            aria-label="Add child"
          >
            <PlusIcon className="size-4" />
          </Button>
          <select
            className="h-7 w-28 cursor-pointer rounded-lg border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring"
            value={node.status}
            onChange={(event) => changeStatus(event.target.value as StandardStatus)}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete node"
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
      {open && children.length > 0
        ? children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              nodes={nodes}
              types={types}
              depth={depth + 1}
            />
          ))
        : null}
      {editOpen ? (
        <NodeEditorDialog node={node} type={type} onClose={() => setEditOpen(false)} />
      ) : null}
      {addOpen ? (
        <AddChildDialog
          parent={node}
          parentType={type}
          types={types}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  );
}

function DocumentCard({
  document,
  nodes,
  types,
}: {
  document: SpineNode;
  nodes: SpineNode[];
  types: NodeTypeDescriptor[];
}) {
  const { run } = useAction();
  const [open, setOpen] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const manifest = (
    (document.payload ?? {}).component_manifest
  ) as ComponentManifest | undefined;
  const coverage = computeComponentCoverage(document, nodes, manifest ?? null);
  const coverageCount = componentCoverageCount(coverage);
  const children = childrenOf(nodes, document.id);
  const type = types.find((t) => t.typeId === document.typeId);

  const onDelete = async () => {
    if (!window.confirm(`Delete document "${document.title}" and its whole tree?`)) return;
    await run(() => deleteStandardNode(document.id), "Document deleted.");
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 text-left"
            onClick={() => setOpen(!open)}
          >
            {children.length > 0 ? (
              open ? (
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              )
            ) : (
              <FileTextIcon className="size-4 text-muted-foreground" />
            )}
            <span className="font-medium">{document.title}</span>
          </button>
          <Badge variant="outline">{type?.typeName ?? "unknown"}</Badge>
          <StatusPill status={document.status} />
          <Badge variant="secondary" title={coverageSatisfied(coverage)}>
            {coverageCount}/4 components
          </Badge>
        </div>
        {document.code ? (
          <CardDescription className="font-mono">{document.code}</CardDescription>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <PenSquareIcon className="size-3.5" />
            Edit
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(!open)}>
            {open ? "Collapse tree" : `Expand tree (${children.length})`}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2Icon className="size-3.5" />
            Delete
          </Button>
        </div>
      </CardHeader>
      {open ? (
        <CardContent className="p-3 pt-0">
          {children.length > 0 ? (
            <div className="space-y-0.5">
              {children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  nodes={nodes}
                  types={types}
                  depth={0}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No nodes yet &mdash; expand the tree after editing, or add a child from any row.
            </p>
          )}
        </CardContent>
      ) : null}
      {editOpen ? (
        <NodeEditorDialog node={document} type={type} onClose={() => setEditOpen(false)} />
      ) : null}
    </Card>
  );
}

function coverageSatisfied(coverage: ReturnType<typeof computeComponentCoverage>): string {
  const labels: Record<string, string> = {
    intent: "Intent",
    content: "Content",
    learning_teaching: "Learning & Teaching",
    assessment: "Assessment",
  };
  return Object.entries(coverage)
    .filter(([, value]) => value.present)
    .map(([id, value]) => `${labels[id] ?? id}: ${value.satisfiedBy.join(", ") || "declared"}`)
    .join("; ");
}

// ------------------------------------------------------------
// Panel
// ------------------------------------------------------------

export function StandardRegistryPanel({
  types,
  nodes,
}: {
  types: NodeTypeDescriptor[];
  nodes: SpineNode[];
}) {
  const [defineOpen, setDefineOpen] = useState(false);
  const [editType, setEditType] = useState<NodeTypeDescriptor | null>(null);
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const { run } = useAction();

  const rootDocs = findRootDocuments(nodes, types);

  const deleteType = async (type: NodeTypeDescriptor) => {
    if (!window.confirm(`Delete type "${type.typeName}"?`)) return;
    await run(() => deleteStandardType(type.typeId), "Type deleted.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Standards registry
          </h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Any curriculum definition as schema-as-data: node types carry
            their payload schemas, root documents declare the four universal
            components, and the tree is authored through a schema-driven
            editor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDefineOpen(true)}>
            <PlusIcon className="size-4" />
            Define type
          </Button>
          <Button onClick={() => setCreateDocOpen(true)}>
            <FilePlus2Icon className="size-4" />
            New document
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Node types ({types.length})</CardTitle>
          <CardDescription>
            The shared vocabulary. NCDC types were registered in earlier
            migrations; agreement for demo standards arrived in Cycle 1.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid gap-1.5">
            {types.map((type) => (
              <div
                key={type.typeId}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50"
              >
                <span className="w-48 truncate font-mono text-xs">{type.typeName}</span>
                {type.isRoot ? (
                  <Badge variant="secondary">root</Badge>
                ) : (
                  <span className="w-12" />
                )}
                <Badge variant="outline" className="hidden lg:inline-flex">
                  {type.payloadSchema ? "schema" : "open"}
                </Badge>
                <span className="hidden flex-1 truncate text-xs text-muted-foreground sm:inline">
                  {type.allowedChildren
                    ? `children: ${type.allowedChildren.join(", ")}`
                    : "any child"}
                </span>
                <div className="flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditType(type)}
                    aria-label={`Edit type ${type.typeName}`}
                  >
                    <PenSquareIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteType(type)}
                    aria-label={`Delete type ${type.typeName}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Standard documents ({rootDocs.length})
          </h4>
        </div>
        {rootDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No standard documents yet &mdash; create one from a root type above.
          </p>
        ) : (
          rootDocs.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              nodes={nodes}
              types={types}
            />
          ))
        )}
      </div>

      {defineOpen ? (
        <TypeSchemaEditor onClose={() => setDefineOpen(false)} initial={null} />
      ) : null}
      {editType ? (
        <TypeSchemaEditor
          key={editType.typeId}
          onClose={() => setEditType(null)}
          initial={editType}
        />
      ) : null}
      {createDocOpen ? (
        <CreateDocumentDialog
          types={types}
          onClose={() => setCreateDocOpen(false)}
        />
      ) : null}
    </div>
  );
}
