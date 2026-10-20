import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ConsolePanel({
  id,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-20 rounded-lg border border-outline-variant bg-surface-container-lowest",
        className,
      )}
    >
      <div className="border-b border-outline-variant px-4 py-3">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      <div className={cn("px-4 py-3", contentClassName)}>{children}</div>
      {footer ? (
        <div className="flex justify-end border-t border-outline-variant px-4 py-3">{footer}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-on-surface-variant">{children}</p>;
}
