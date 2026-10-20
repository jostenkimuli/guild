import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: { label: string; href: string }[];
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span className="select-none">/</span>}
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              </span>
            ))}
            <span className="select-none">/</span>
            <span className="font-medium text-foreground">{title}</span>
          </nav>
        )}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      {children}
    </div>
  );
}

export function StatusTabs({
  tabs,
  active,
  buildHref,
}: {
  tabs: { label: string; value: string | null; count: number }[];
  active: string | null;
  buildHref: (overrides: Record<string, string | undefined>) => string;
}) {
  return (
    <div className="flex rounded-md border bg-background p-0.5">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.label}
            href={buildHref({ status: tab.value ?? undefined, page: "1" })}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function TypeChips({
  types,
  active,
  buildHref,
}: {
  types: { label: string; value: string }[];
  active: string | null;
  buildHref: (overrides: Record<string, string | undefined>) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((t) => (
        <Link
          key={t.value}
          href={buildHref({ type: active === t.value ? undefined : t.value, page: "1" })}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
            active === t.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function SearchForm({
  action,
  defaultValue,
  hiddenFields,
  buildHref,
}: {
  action: string;
  defaultValue: string;
  hiddenFields?: Record<string, string>;
  buildHref: (overrides: Record<string, string | undefined>) => string;
}) {
  return (
    <form method="GET" action={action} className="flex items-center gap-2 ml-auto">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by username…"
        className="h-7 w-44 rounded-md border bg-background px-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {defaultValue && (
        <Link
          href={buildHref({ q: undefined, page: "1" })}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

export function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {children}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  from,
  to,
  count,
  buildHref,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  count: number;
  buildHref: (overrides: Record<string, string | undefined>) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {from + 1}–{Math.min(to + 1, count)} of {count}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref({ page: String(page - 1) })}
            className="rounded-md border bg-background px-3 py-1.5 hover:bg-muted transition-colors"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref({ page: String(page + 1) })}
            className="rounded-md border bg-background px-3 py-1.5 hover:bg-muted transition-colors"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export function FeedbackBanner({
  success,
  error,
}: {
  success?: string | null;
  error?: string | null;
}) {
  return (
    <>
      {success && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          {success}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
