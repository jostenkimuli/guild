"use client";

// Schema-driven payload editor: renders any payload that matches a
// registered `node_types.payload_schema` (draft-7 subset) as a
// controlled form over shadcn primitives. Fully controlled — the
// caller owns the payload object and receives immutable patches via
// `onChange`. The DB CHECK (`node_payload_valid`) is the authority;
// this editor only structures the editing surface.
//
// Widget selection:
//   object            → nested section (ordered by x-order)
//   array             → repeatable items (string chips / object cards)
//   string + enum     → native select
//   string + x-widget textarea | minLength > 120 → Textarea
//   string + x-widget json         → monospace JSON editor (commits when valid)
//   boolean | checkbox             → native checkbox
//   integer / number               → number input (empty = null candidate)
//   string / fallback              → Input

import { useRef, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  newArrayItem,
  schemaOrderedKeys,
  schemaPrimitiveType,
  type JsonSchema,
} from "@/lib/curriculum-spine/schema";

type Segments = Array<string | number>;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function humanize(key: string): string {
  return key
    .replace(/^_+|_+$/g, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function applyPatch(root: unknown, segments: Segments, value: unknown): unknown {
  if (segments.length === 0) return value;
  const [head, ...rest] = segments;
  const base = (root ?? {}) as Record<string, unknown>;
  if (typeof head === "number") {
    const copy = (Array.isArray(base) ? [...base] : []) as unknown[];
    copy[head] = rest.length === 0 ? value : applyPatch(copy[head], rest, value);
    return copy;
  }
  const copy = { ...base };
  copy[head] = rest.length === 0 ? value : applyPatch(base[head], rest, value);
  return copy;
}

function JsonField({
  value,
  onCommit,
  id,
  disabled,
}: {
  value: unknown;
  onCommit: (value: unknown) => void;
  id?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState<string>(() => displayText(value));
  const committedRef = useRef(value);

  const handleChange = (next: string) => {
    setText(next);
    try {
      const parsed: unknown = JSON.parse(next);
      if (typeof parsed === "object" && parsed !== null) {
        committedRef.current = parsed;
        onCommit(parsed);
      }
    } catch {
      // not valid yet — hold text, do not commit
    }
  };

  return (
    <Textarea
      id={id}
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      rows={6}
      disabled={disabled}
      className="font-mono text-xs leading-relaxed"
      placeholder="{ ... }"
    />
  );
}

function CheckField({
  checked,
  onCommit,
  id,
  disabled,
}: {
  checked: boolean;
  onCommit: (value: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onCommit(event.target.checked)}
      className="size-4 cursor-pointer accent-foreground"
    />
  );
}

function ArrayInput({
  schema,
  value,
  segments,
  onPatch,
  disabled,
}: {
  schema: JsonSchema;
  value: unknown[];
  segments: Segments;
  onPatch: (segments: Segments, value: unknown) => void;
  disabled?: boolean;
}) {
  const items = schema.items && !Array.isArray(schema.items) ? schema.items : undefined;
  const itemType = items ? schemaPrimitiveType(items) : null;

  const add = () => onPatch(segments, [...value, newArrayItem(items)]);
  const remove = (index: number) =>
    onPatch(segments, value.filter((_, i) => i !== index));

  if (itemType === "object" && items) {
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label="Remove item"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
            <ObjectInput
              schema={items}
              value={(item as Record<string, unknown>) ?? {}}
              segments={[...segments, index]}
              onPatch={onPatch}
              disabled={disabled}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={disabled}>
          <PlusIcon className="size-4" />
          Add item
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={displayText(item)}
            disabled={disabled}
            onChange={(event) =>
              onPatch(
                [...segments, index],
                itemType === "integer" || itemType === "number"
                  ? event.target.value === ""
                    ? null
                    : Number(event.target.value)
                  : event.target.value,
              )
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            disabled={disabled}
            aria-label="Remove item"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={disabled}>
        <PlusIcon className="size-4" />
        Add
      </Button>
    </div>
  );
}

function ObjectInput({
  schema,
  value,
  segments,
  onPatch,
  disabled,
}: {
  schema: JsonSchema;
  value: Record<string, unknown>;
  segments: Segments;
  onPatch: (segments: Segments, value: unknown) => void;
  disabled?: boolean;
}) {
  const required = new Set(schema.required ?? []);
  return (
    <div className="grid gap-3">
      {schemaOrderedKeys(schema).map((key) => {
        const child = schema.properties?.[key];
        if (!child) return null;
        const childSegments = [...segments, key];
        const id = childSegments.join(".");
        const hint = child["x-help"] ?? child.description;
        return (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={id}>
              {child.title ?? humanize(key)}
              {required.has(key) ? (
                <span className="ml-1 text-destructive">*</span>
              ) : null}
            </Label>
            <FieldValue
              schema={child}
              value={value?.[key]}
              segments={childSegments}
              onPatch={onPatch}
              disabled={disabled}
              id={id}
            />
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function FieldValue({
  schema,
  value,
  segments,
  onPatch,
  disabled,
  id,
}: {
  schema: JsonSchema;
  value: unknown;
  segments: Segments;
  onPatch: (segments: Segments, value: unknown) => void;
  disabled?: boolean;
  id?: string;
}) {
  const type = schemaPrimitiveType(schema);
  const widget = schema["x-widget"];

  if (type === "object") {
    return (
      <ObjectInput
        schema={schema}
        value={(value as Record<string, unknown>) ?? {}}
        segments={segments}
        onPatch={onPatch}
        disabled={disabled}
      />
    );
  }
  if (type === "array") {
    return (
      <ArrayInput
        schema={schema}
        value={Array.isArray(value) ? value : []}
        segments={segments}
        onPatch={onPatch}
        disabled={disabled}
      />
    );
  }
  if (schema.enum && schema.enum.length > 0) {
    return (
      <select
        id={id}
        className={selectClass}
        value={displayText(value)}
        disabled={disabled}
        onChange={(event) => onPatch(segments, event.target.value)}
      >
        <option value="">— select —</option>
        {schema.enum.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  switch (widget) {
    case "json":
      return (
        <JsonField
          value={value}
          onCommit={(next) => onPatch(segments, next)}
          id={id}
          disabled={disabled}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={id}
          value={displayText(value)}
          disabled={disabled}
          rows={5}
          onChange={(event) => onPatch(segments, event.target.value)}
        />
      );
    case "checkbox":
      return (
        <CheckField
          checked={Boolean(value)}
          onCommit={(next) => onPatch(segments, next)}
          id={id}
          disabled={disabled}
        />
      );
    default:
      break;
  }

  switch (type) {
    case "boolean":
      return (
        <CheckField
          checked={Boolean(value)}
          onCommit={(next) => onPatch(segments, next)}
          id={id}
          disabled={disabled}
        />
      );
    case "integer":
    case "number":
      return (
        <Input
          id={id}
          type="number"
          value={displayText(value)}
          disabled={disabled}
          onChange={(event) =>
            onPatch(
              segments,
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        />
      );
    case "string":
      if ((schema.minLength ?? 0) > 120) {
        return (
          <Textarea
            id={id}
            value={displayText(value)}
            disabled={disabled}
            rows={5}
            onChange={(event) => onPatch(segments, event.target.value)}
          />
        );
      }
      return (
        <Input
          id={id}
          value={displayText(value)}
          disabled={disabled}
          placeholder={schema["x-placeholder"]}
          onChange={(event) => onPatch(segments, event.target.value)}
        />
      );
    default:
      return (
        <JsonField
          value={value}
          onCommit={(next) => onPatch(segments, next)}
          id={id}
          disabled={disabled}
        />
      );
  }
}

export function JsonSchemaForm({
  schema,
  value,
  onChange,
  disabled,
}: {
  schema: JsonSchema;
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const handlePatch = (segments: Segments, next: unknown) => {
    onChange(applyPatch(value ?? {}, segments, next) as Record<string, unknown>);
  };

  return (
    <ObjectInput
      schema={schema}
      value={value ?? {}}
      segments={[]}
      onPatch={handlePatch}
      disabled={disabled}
    />
  );
}