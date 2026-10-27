"use client";

import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  CheckCircle2Icon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getMockSubscriptionsForEcosystem,
  subscribeMockStandard,
  type MockEcosystem,
  type MockStandardDocument,
  type MockSubscription,
  unsubscribeMockStandard,
} from "@/lib/playground/mock";
import { cn } from "@/lib/utils";

const COMPONENT_TOTAL = 4;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------
// Subscription row
// ---------------------------------------------------------------

function SubscriptionCard({
  subscription,
  document,
  onUnsubscribe,
  onResubscribe,
}: {
  subscription: MockSubscription;
  document: MockStandardDocument | undefined;
  onUnsubscribe: (code: string) => void;
  onResubscribe: (code: string) => void;
}) {
  const archived = subscription.status === "archived";
  const coverage = document?.coverage ?? 0;

  return (
    <Card className={cn("p-4", archived && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium">
              {document?.title ?? subscription.document_code}
            </h4>
            {document ? <Badge variant="outline">{document.type_name}</Badge> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <code className="font-mono text-[11px]">{subscription.document_code}</code>
            {document?.country ? <span>{document.country}</span> : null}
            {document?.year ? <span>{document.year}</span> : null}
            <span>
              by {subscription.subscribed_by} · {formatDate(subscription.subscribed_at)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {archived ? (
            <Badge variant="outline" className="text-muted-foreground">
              <ArchiveIcon className="size-3.5" /> Archived
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2Icon className="size-3.5 text-emerald-500" /> In use
            </Badge>
          )}
          <Badge variant={coverage === COMPONENT_TOTAL ? "secondary" : "outline"}>
            {coverage}/{COMPONENT_TOTAL} components
          </Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        {archived ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResubscribe(subscription.document_code)}
          >
            <RotateCcwIcon className="size-3.5" /> Restore
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => onUnsubscribe(subscription.document_code)}
          >
            Stop using
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------
// Registry-root picker dialog
// ---------------------------------------------------------------

function DocumentPicker({
  ecosystem,
  documents,
  subscriptions,
  onSubscribe,
  open,
  onOpenChange,
}: {
  ecosystem: MockEcosystem;
  documents: MockStandardDocument[];
  subscriptions: MockSubscription[];
  onSubscribe: (code: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");

  const activeCodes = useMemo(
    () =>
      new Set(
        subscriptions
          .filter((s) => s.status === "active")
          .map((s) => s.document_code),
      ),
    [subscriptions],
  );
  const archivedCodes = useMemo(
    () =>
      new Set(
        subscriptions
          .filter((s) => s.status === "archived")
          .map((s) => s.document_code),
      ),
    [subscriptions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches =
      q.length === 0
        ? documents
        : documents.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              d.code.toLowerCase().includes(q) ||
              d.type_name.toLowerCase().includes(q) ||
              (d.country ?? "").toLowerCase().includes(q),
          );
    return [...matches].sort((a, b) => {
      const aActive = activeCodes.has(a.code) ? 1 : 0;
      const bActive = activeCodes.has(b.code) ? 1 : 0;
      if (aActive !== bActive) return aActive - bActive;
      return a.title.localeCompare(b.title);
    });
  }, [documents, query, activeCodes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="size-4" /> Subscribe to a standard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Subscribe to a standard</DialogTitle>
          <DialogDescription>
            {ecosystem.name} will follow the standard and every space inside it
            shares the subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, code or type…"
            className="pl-8"
          />
        </div>

        <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
          {filtered.map((doc) => {
            const used = activeCodes.has(doc.code);
            const archived = archivedCodes.has(doc.code);
            return (
              <div
                key={doc.code}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3",
                  used && "bg-muted/40",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{doc.title}</span>
                    <Badge variant="outline">{doc.type_name}</Badge>
                    {doc.status === "draft" ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Draft
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <code className="font-mono text-[11px]">{doc.code}</code>
                    {doc.country ? <span>{doc.country}</span> : null}
                    {doc.year ? <span>{doc.year}</span> : null}
                    <span>
                      <Badge
                        variant={
                          doc.coverage === COMPONENT_TOTAL ? "secondary" : "outline"
                        }
                      >
                        {doc.coverage}/{COMPONENT_TOTAL} components
                      </Badge>
                    </span>
                  </div>
                </div>
                {used ? (
                  <Button size="sm" variant="outline" disabled>
                    In use
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onSubscribe(doc.code)}>
                    {archived ? "Resubscribe" : "Subscribe"}
                  </Button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No standards match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <p className="pt-1 text-xs text-muted-foreground">
              {documents.length} standards in the registry ·{" "}
              {activeCodes.size} already in use by {ecosystem.name}.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------
// Panel
// ---------------------------------------------------------------

export function EcosystemSubscriptions({
  ecosystem,
  documents,
  initialSubscriptions,
  adminName,
  spacesCount,
}: {
  ecosystem: MockEcosystem;
  documents: MockStandardDocument[];
  initialSubscriptions: MockSubscription[];
  adminName: string;
  spacesCount: number;
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [pickerOpen, setPickerOpen] = useState(false);

  const active = subscriptions.filter((s) => s.status === "active");
  const archived = subscriptions.filter((s) => s.status === "archived");
  const documentByCode = new Map(documents.map((d) => [d.code, d]));

  const refresh = () =>
    setSubscriptions([...getMockSubscriptionsForEcosystem(ecosystem.id)]);

  const handleSubscribe = (code: string) => {
    subscribeMockStandard(ecosystem.id, code, adminName);
    refresh();
  };

  const handleUnsubscribe = (code: string) => {
    unsubscribeMockStandard(ecosystem.id, code);
    refresh();
  };

  return (
    <Card>
      <CardHeader className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="text-base">{ecosystem.name}</CardTitle>
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheckIcon className="size-3.5" /> Ecosystem admin
            </Badge>
          </div>
          <code className="font-mono text-xs text-muted-foreground">
            {ecosystem.slug}
          </code>
        </div>
        <CardDescription>
          Subscribing activates a standard for every space inside —{" "}
          {spacesCount} {spacesCount === 1 ? "space" : "spaces"} follow it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {active.length > 0 ? (
          active.map((subscription) => (
            <SubscriptionCard
              key={subscription.document_code}
              subscription={subscription}
              document={documentByCode.get(subscription.document_code)}
              onUnsubscribe={handleUnsubscribe}
              onResubscribe={handleSubscribe}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm font-medium">No subscribed standards yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Subscribe to a national standard or curriculum document to give the
              ecosystem&apos;s spaces a common spine.
            </p>
          </div>
        )}

        {archived.length > 0 ? (
          <div className="space-y-3 border-t pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Archived ({archived.length})
            </p>
            {archived.map((subscription) => (
              <SubscriptionCard
                key={subscription.document_code}
                subscription={subscription}
                document={documentByCode.get(subscription.document_code)}
                onUnsubscribe={handleUnsubscribe}
                onResubscribe={handleSubscribe}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <DocumentPicker
            ecosystem={ecosystem}
            documents={documents}
            subscriptions={subscriptions}
            onSubscribe={handleSubscribe}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
          />
          <p className="text-xs text-muted-foreground">
            {documents.length} standards in registry
          </p>
        </div>
      </CardContent>
    </Card>
  );
}