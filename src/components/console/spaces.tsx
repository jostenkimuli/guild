"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { spaceTypeLabel } from "@/lib/ecosystems";

export type SpaceSummary = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  slug: string | null;
};

export function SpaceCard({ space }: { space: SpaceSummary }) {
  const href = `/spaces/${space.slug ?? space.id}`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">{space.name}</p>
          {space.description ? (
            <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">{space.description}</p>
          ) : null}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {spaceTypeLabel(space.type)}
        </Badge>
      </div>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href={href}>Open space →</Link>
      </Button>
    </div>
  );
}
