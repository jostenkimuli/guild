"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import {
  NEUTRAL_THEME,
  applyTheme,
  generatePalette,
  type EcosystemThemeConfig,
} from "@/lib/theme";

/**
 * Applies a per-ecosystem theme by writing the generated token set
 * onto `document.documentElement` so every shadcn/Material token the
 * app uses resolves to the school's palette for the whole session.
 * Pass `null` to restore the neutral default skin.
 */
export function EcosystemThemeProvider({
  config,
  children,
}: {
  config: EcosystemThemeConfig | null;
  children: ReactNode;
}) {
  useEffect(() => {
    applyTheme(document.documentElement, generatePalette(config ?? NEUTRAL_THEME));
  }, [config]);

  return <>{children}</>;
}