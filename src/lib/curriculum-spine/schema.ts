// JSON Schema (draft-7) subset driving the generic standard tooling.
//
// The database is the authority: `node_payload_valid` validates payloads
// against the schema stored on `node_types.payload_schema` via
// pg_jsonschema. These helpers drive the schema-driven UI (defaults,
// widget hints, light required/type checks) and normalize the registry's
// stored schema into a typed value. Unknown keywords are tolerated so a
// registered schema can use everything pg_jsonschema supports even when
// the v1 UI renders advanced constructs as plain JSON.
//
// No imports on purpose: this module must be importable from server
// actions, client components, and (via type stripping) the seed script.

export type JsonSchemaScalarType =
  | "object"
  | "array"
  | "string"
  | "integer"
  | "number"
  | "boolean";

export type JsonSchemaTypeName = JsonSchemaScalarType | "null";

export type JsonSchemaWidget =
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "password"
  | "json";

export interface JsonSchema {
  type?: JsonSchemaScalarType | JsonSchemaTypeName[];
  title?: string;
  description?: string;
  $comment?: string;
  default?: unknown;
  readOnly?: boolean;

  // object
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;

  // array
  items?: JsonSchema | JsonSchema[];
  minItems?: number;
  maxItems?: number;

  // string
  enum?: string[];
  format?: string;
  minLength?: number;
  maxLength?: number;

  // number / integer
  minimum?: number;
  maximum?: number;

  // UI hints (extension keywords — not validated by pg_jsonschema)
  "x-widget"?: JsonSchemaWidget;
  "x-order"?: number;
  "x-help"?: string;
  "x-placeholder"?: string;
}

/** True when the schema allows `null` (e.g. `["string", "null"]`). */
export function schemaIsNullable(schema: JsonSchema): boolean {
  return Array.isArray(schema.type) && schema.type.includes("null");
}

/** Canonical (non-null) primitive type of a schema, or null when none. */
export function schemaPrimitiveType(
  schema: JsonSchema,
): JsonSchemaScalarType | null {
  if (typeof schema.type === "string") {
    return schema.type;
  }
  if (Array.isArray(schema.type)) {
    for (const t of schema.type) {
      if (t !== "null") return t as JsonSchemaScalarType;
    }
  }
  return null;
}

/**
 * Top-level object property keys, ordered by `x-order` then insertion
 * order (JSON object key order is preserved on parse).
 */
export function schemaOrderedKeys(schema: JsonSchema): string[] {
  return Object.keys(schema.properties ?? {}).sort((a, b) => {
    const ao = schema.properties?.[a]?.["x-order"] ?? Number.POSITIVE_INFINITY;
    const bo = schema.properties?.[b]?.["x-order"] ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const indexA = Object.keys(schema.properties ?? {}).indexOf(a);
    const indexB = Object.keys(schema.properties ?? {}).indexOf(b);
    return indexA - indexB;
  });
}

function clone(value: unknown): unknown {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

/**
 * A starter instance for a payload of `schema`: objects get every
 * declared property defaulted recursively, scalars/arrays get their
 * primitive default ("" / 0 / false / []).
 */
export function defaultValue(schema: JsonSchema | undefined): unknown {
  if (!schema) return undefined;
  if (schema.default !== undefined) return clone(schema.default);
  switch (schemaPrimitiveType(schema)) {
    case "object": {
      const out: Record<string, unknown> = {};
      for (const key of schemaOrderedKeys(schema)) {
        const child = schema.properties?.[key];
        const dv = child ? defaultValue(child) : undefined;
        if (dv !== undefined) out[key] = dv;
      }
      return out;
    }
    case "array":
      return [];
    case "string":
      return "";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return false;
    default:
      return undefined;
  }
}

/** A fresh item to append to an array field described by `items`. */
export function newArrayItem(items: JsonSchema | JsonSchema[] | undefined): unknown {
  if (items && !Array.isArray(items)) return defaultValue(items) ?? "";
  return "";
}

export interface ShapeError {
  path: string;
  message: string;
}

function joinPath(path: string, key: string): string {
  return path ? `${path}.${key}` : key;
}

/**
 * Light structural validation (required keys, primitive types, enum,
 * min/max). The database CHECK is the final authority; this only powers
 * client-side feedback and draft sanity.
 */
export function validateValue(
  schema: JsonSchema,
  value: unknown,
  path = "",
): ShapeError[] {
  const errors: ShapeError[] = [];
  const type = schemaPrimitiveType(schema);

  if (value === null || value === undefined) {
    if (!schemaIsNullable(schema) && type !== null) {
      errors.push({ path: path || "payload", message: "a value is required" });
    }
    return errors;
  }

  switch (type) {
    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) {
        errors.push({ path: path || "payload", message: "expected an object" });
        break;
      }
      const record = value as Record<string, unknown>;
      for (const key of schema.required ?? []) {
        if (record[key] === undefined) {
          errors.push({ path: joinPath(path, key), message: "a value is required" });
        }
      }
      for (const key of schemaOrderedKeys(schema)) {
        const child = schema.properties?.[key];
        if (child === undefined || record[key] === undefined) continue;
        errors.push(...validateValue(child, record[key], joinPath(path, key)));
      }
      break;
    }
    case "array": {
      if (!Array.isArray(value)) {
        errors.push({ path: path || "payload", message: "expected an array" });
        break;
      }
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push({ path: path || "payload", message: `at least ${schema.minItems} items required` });
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        errors.push({ path: path || "payload", message: `no more than ${schema.maxItems} items allowed` });
      }
      const itemsSchema = schema.items;
      if (itemsSchema && !Array.isArray(itemsSchema)) {
        value.forEach((item, index) => {
          errors.push(...validateValue(itemsSchema, item, `${path || "payload"}[${index}]`));
        });
      }
      break;
    }
    case "string": {
      if (typeof value !== "string") {
        errors.push({ path: path || "payload", message: "expected text" });
        break;
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push({ path: path || "payload", message: `must be one of: ${schema.enum.join(", ")}` });
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({ path: path || "payload", message: "value is too short" });
      }
      break;
    }
    case "integer": {
      const numeric = Number(value);
      if (!Number.isInteger(numeric)) {
        errors.push({ path: path || "payload", message: "expected a whole number" });
        break;
      }
      if (schema.minimum !== undefined && numeric < schema.minimum) {
        errors.push({ path: path || "payload", message: `must be at least ${schema.minimum}` });
      }
      break;
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push({ path: path || "payload", message: "expected a number" });
        break;
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({ path: path || "payload", message: `must be at least ${schema.minimum}` });
      }
      break;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        errors.push({ path: path || "payload", message: "expected yes or no" });
      }
      break;
    }
    default:
      break;
  }

  return errors;
}

/**
 * Normalize a registry `payload_schema` JSON value into a typed schema,
 * or null when unset / not an object (unregistered types validate open).
 */
export function parseSchema(value: unknown): JsonSchema | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value === undefined
  ) {
    return null;
  }
  return value as JsonSchema;
}