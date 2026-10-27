// Read-only renderer for a payload against a registered schema
// (draft-7 subset). Uses the same ordering as the editor. When no
// schema is available it falls back to the raw record, so nothing in a
// payload is ever silently dropped.

import type { JsonSchema } from "@/lib/curriculum-spine/schema";
import { schemaOrderedKeys } from "@/lib/curriculum-spine/schema";
import type { ReactNode } from "react";

function humanize(key: string): string {
  return key
    .replace(/^_+|_+$/g, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ViewValue({ schema, value }: { schema?: JsonSchema; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (schema) {
    if (schema.type === "object" && typeof value === "object" && !Array.isArray(value)) {
      return (
        <ObjectView
          schema={schema}
          value={value as Record<string, unknown>}
        />
      );
    }
    if (schema.type === "array" && Array.isArray(value)) {
      return <ArrayView schema={schema} value={value} />;
    }
  }
  if (Array.isArray(value)) {
    return <ArrayView schema={undefined} value={value} />;
  }
  if (typeof value === "object") {
    return <ObjectView schema={undefined} value={value as Record<string, unknown>} />;
  }
  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

function ArrayView({
  schema,
  value,
}: {
  schema?: JsonSchema;
  value: unknown[];
}) {
  const items = schema?.items && !Array.isArray(schema.items) ? schema.items : undefined;
  const itemType = items && !Array.isArray(items.type) ? items.type : undefined;
  const allObjects = value.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  );
  if (allObjects) {
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="rounded-lg border p-3">
            <ObjectView
              schema={items}
              value={item as Record<string, unknown>}
            />
          </li>
        ))}
      </ul>
    );
  }
  if (itemType === "string" || value.every((item) => typeof item === "string")) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <span
            key={index}
            className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {value.map((item, index) => (
        <li key={index}>
          <ViewValue value={item} />
        </li>
      ))}
    </ul>
  );
}

function ObjectView({
  schema,
  value,
}: {
  schema?: JsonSchema;
  value: Record<string, unknown>;
}) {
  const required = new Set(schema?.required ?? []);
  const schemaKeys = schema ? schemaOrderedKeys(schema) : Object.keys(value);
  const extraKeys = Object.keys(value).filter((key) => !schemaKeys.includes(key));

  return (
    <dl className="grid gap-2.5">
      {schemaKeys.map((key) => {
        const child = schema?.properties?.[key];
        const childValue = value[key];
        if (childValue === null || childValue === undefined) return null;
        const hint = child?.["x-help"] ?? child?.description;
        return (
          <div key={key} className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">
              {child?.title ?? humanize(key)}
              {required.has(key) ? <span className="ml-1 text-destructive">*</span> : null}
            </dt>
            <dd className="text-sm">
              <ViewValue schema={child} value={childValue} />
            </dd>
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>
        );
      })}
      {extraKeys.length > 0 ? (
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">
            Additional fields
          </dt>
          <dd>
            <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-2 font-mono text-xs">
              {JSON.stringify(
                Object.fromEntries(
                  extraKeys.map((key) => [key, value[key]]),
                ),
                null,
                2,
              )}
            </pre>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export function JsonSchemaView({
  schema,
  value,
}: {
  schema?: JsonSchema | null;
  value: Record<string, unknown> | null | undefined;
}): ReactNode {
  if (!value || Object.keys(value).length === 0) {
    return <p className="text-sm text-muted-foreground">No payload.</p>;
  }
  return <ObjectView schema={schema ?? undefined} value={value} />;
}