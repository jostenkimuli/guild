// Material-style per-ecosystem theme engine.
//
// Given a dominant color, a supporting-tone preset and an accent
// highlight, we derive a full Material-3-ish token set (the same
// tokens the dash.html / theme.html prototypes use: primary-,
// secondary-, tertiary-, surface-* families) and map them onto the
// shadcn tokens the app already consumes (--primary, --background,
// --ring, --sidebar-*, ...).

export const SUPPORTING_TONES = [
  "modern_blue",
  "warm_slate",
  "minimalist_light",
] as const;
export type SupportingTone = (typeof SUPPORTING_TONES)[number];

export const SUPPORTING_TONE_LABELS: Record<SupportingTone, string> = {
  modern_blue: "Modern Blue",
  warm_slate: "Warm Slate",
  minimalist_light: "Minimalist Light",
};

export function isSupportingTone(value: string | null | undefined): value is SupportingTone {
  return !!value && (SUPPORTING_TONES as readonly string[]).includes(value);
}

export type EcosystemThemeConfig = {
  badgeUrl: string | null;
  primary: string | null;
  supporting: SupportingTone | null;
  accent: string | null;
};

/** Preset dominant colors offered in the theme designer. */
export const DOMINANT_PRESETS: { label: string; value: string }[] = [
  { label: "Classic Blue", value: "#0040e0" },
  { label: "Deep Teal", value: "#0d9488" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Crimson", value: "#e11d48" },
];

/** Preset accent highlights. `null` means "derive from primary". */
export const ACCENT_PRESETS: { label: string; value: string | null; swatch?: string }[] = [
  { label: "Automatic", value: null, swatch: "#8c9eff" },
  { label: "Terracotta", value: "#c4682d" },
  { label: "Deep Teal", value: "#0d9488" },
  { label: "Emerald", value: "#10b981" },
];

export const DEFAULT_THEME: EcosystemThemeConfig = {
  badgeUrl: null,
  primary: "#0040e0",
  supporting: "modern_blue",
  accent: null,
};

/**
 * The neutral palette applied when no school theme is configured
 * (keeps non-school roles looking like the stock shadcn skin).
 */
export const NEUTRAL_THEME: EcosystemThemeConfig = {
  badgeUrl: null,
  primary: "#0f172a",
  supporting: "minimalist_light",
  accent: "#475569",
};

export function themeConfigFromRow(row: {
  badge_url?: string | null;
  theme_primary?: string | null;
  theme_supporting?: string | null;
  theme_accent?: string | null;
}): EcosystemThemeConfig {
  return {
    badgeUrl: row.badge_url || null,
    primary: row.theme_primary || null,
    supporting: isSupportingTone(row.theme_supporting) ? row.theme_supporting : null,
    accent: row.theme_accent || null,
  };
}

// ---------------------------------------------------------------
// Color math (HSL based)
// ---------------------------------------------------------------

type RGB = [number, number, number];

function clamp(v: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, v));
}

function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h, 16);
  if (!h.match(/^[0-9a-f]{6}$/i) || Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b]
    .map((v) => Math.round(clamp(v)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h * 60, s * 100, l * 100];
}

function hslToRgb([h, s, l]: [number, number, number]): RGB {
  const hn = ((h % 360) + 360) % 360;
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let rgb: [number, number, number];
  if (hn < 60) rgb = [c, x, 0];
  else if (hn < 120) rgb = [x, c, 0];
  else if (hn < 180) rgb = [0, c, x];
  else if (hn < 240) rgb = [0, x, c];
  else if (hn < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return [
    Math.round((rgb[0] + m) * 255),
    Math.round((rgb[1] + m) * 255),
    Math.round((rgb[2] + m) * 255),
  ];
}

function mixHex(a: string, b: string, t: number): string {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return rgbToHex([ar[0] + (br[0] - ar[0]) * t, ar[1] + (br[1] - ar[1]) * t, ar[2] + (br[2] - ar[2]) * t]);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function onColor(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? "#111827" : "#ffffff";
}

function neutralHex(hue: number, sat: number, light: number): string {
  return rgbToHex(hslToRgb([hue, sat, light]));
}

function secondaryFromPrimary(primary: string): string {
  const [h, s] = rgbToHsl(hexToRgb(primary));
  // Complementary-ish supporting tone (keeps pairs lively for any hue).
  return rgbToHex(hslToRgb([((h + 150) % 360 + 360) % 360, Math.min(s, 55), 42]));
}

function tertiaryFromSecondary(secondary: string): string {
  const [h, s] = rgbToHsl(hexToRgb(secondary));
  return rgbToHex(hslToRgb([((h - 45) % 360 + 360) % 360, Math.min(s, 45), 44]));
}

type ToneFamily = {
  base: string;
  onBase: string;
  container: string;
  onContainer: string;
  fixed: string;
  onFixed: string;
  fixedDim: string;
  onFixedVariant: string;
};

function buildToneFamily(base: string): ToneFamily {
  return {
    base,
    onBase: onColor(base),
    container: mixHex(base, "#ffffff", 0.86),
    onContainer: mixHex(base, "#000000", 0.42),
    fixed: mixHex(base, "#ffffff", 0.78),
    onFixed: mixHex(base, "#000000", 0.7),
    fixedDim: mixHex(base, "#ffffff", 0.45),
    onFixedVariant: mixHex(base, "#000000", 0.35),
  };
}

const NEUTRAL_PRESETS: Record<
  SupportingTone,
  { label: string; hue: number; surfaceSat: number; textSat: number }
> = {
  modern_blue: { label: "Modern Blue", hue: 231, surfaceSat: 18, textSat: 55 },
  warm_slate: { label: "Warm Slate", hue: 26, surfaceSat: 10, textSat: 18 },
  minimalist_light: { label: "Minimalist Light", hue: 230, surfaceSat: 4, textSat: 4 },
};

// ---------------------------------------------------------------
// Palette generation
// ---------------------------------------------------------------

export type ThemeTokens = Record<string, string>;

export function generatePalette(cfg: EcosystemThemeConfig): ThemeTokens {
  const primary = (cfg.primary || DEFAULT_THEME.primary || "#0040e0").trim();
  const supporting = cfg.supporting ?? "modern_blue";
  const accent = cfg.accent?.trim() || secondaryFromPrimary(primary);

  const n = NEUTRAL_PRESETS[supporting];
  const p = buildToneFamily(primary);
  const s = buildToneFamily(accent);
  const t = buildToneFamily(tertiaryFromSecondary(accent));

  const surface = neutralHex(n.hue, n.surfaceSat, 97);
  const onSurface = neutralHex(n.hue, n.textSat * 0.55, 12);
  const onSurfaceVariant = neutralHex(n.hue, n.textSat * 0.45, 30);
  const inverseSurface = neutralHex(n.hue, n.textSat * 0.2, 19);
  const inverseOnSurface = neutralHex(n.hue, n.textSat * 0.3, 93);
  const surfaceTint = primary;

  // Standard error palette (stable across themes for accessibility).
  const err = buildToneFamily("#ba1a1a");

  return {
    // shadcn aliases
    background: surface,
    foreground: onSurface,
    card: neutralHex(n.hue, n.surfaceSat, 100),
    "card-foreground": onSurface,
    popover: neutralHex(n.hue, n.surfaceSat, 100),
    "popover-foreground": onSurface,
    primary: p.base,
    "primary-foreground": p.onBase,
    secondary: s.base,
    "secondary-foreground": s.onBase,
    muted: neutralHex(n.hue, n.surfaceSat, 91),
    "muted-foreground": onSurfaceVariant,
    accent: s.container,
    "accent-foreground": s.onContainer,
    destructive: err.base,
    "destructive-foreground": err.onBase,
    border: neutralHex(n.hue, n.textSat * 0.28, 78),
    input: neutralHex(n.hue, n.textSat * 0.28, 78),
    ring: p.base,

    // sidebar
    sidebar: neutralHex(n.hue, n.surfaceSat, 100),
    "sidebar-foreground": onSurface,
    "sidebar-primary": p.base,
    "sidebar-primary-foreground": p.onBase,
    "sidebar-accent": n.surfaceSat > 10 ? neutralHex(n.hue, n.surfaceSat, 89) : neutralHex(n.hue, n.textSat * 0.22, 89),
    "sidebar-accent-foreground": onSurface,
    "sidebar-border": neutralHex(n.hue, n.textSat * 0.28, 78),
    "sidebar-ring": p.base,

    // material: primary family
    "on-primary": p.onBase,
    "primary-container": p.container,
    "on-primary-container": p.onContainer,
    "primary-fixed": p.fixed,
    "on-primary-fixed": p.onFixed,
    "primary-fixed-dim": p.fixedDim,
    "on-primary-fixed-variant": p.onFixedVariant,
    "inverse-primary": mixHex(primary, "#ffffff", 0.78),

    // material: secondary family
    "on-secondary": s.onBase,
    "secondary-container": s.container,
    "on-secondary-container": s.onContainer,
    "secondary-fixed": s.fixed,
    "on-secondary-fixed": s.onFixed,
    "secondary-fixed-dim": s.fixedDim,
    "on-secondary-fixed-variant": s.onFixedVariant,

    // material: tertiary family
    tertiary: t.base,
    "on-tertiary": t.onBase,
    "tertiary-container": t.container,
    "on-tertiary-container": t.onContainer,
    "tertiary-fixed": t.fixed,
    "on-tertiary-fixed": t.onFixed,
    "tertiary-fixed-dim": t.fixedDim,
    "on-tertiary-fixed-variant": t.onFixedVariant,

    // material: error family
    error: err.base,
    "on-error": err.onBase,
    "error-container": err.container,
    "on-error-container": err.onContainer,

    // material: surfaces
    "on-background": onSurface,
    surface,
    "on-surface": onSurface,
    "surface-variant": neutralHex(n.hue, n.surfaceSat, 88),
    "on-surface-variant": onSurfaceVariant,
    "surface-container-lowest": neutralHex(n.hue, n.surfaceSat, 100),
    "surface-container-low": neutralHex(n.hue, n.surfaceSat, 95.5),
    "surface-container": neutralHex(n.hue, n.surfaceSat, 92.8),
    "surface-container-high": neutralHex(n.hue, n.surfaceSat, 90.8),
    "surface-container-highest": neutralHex(n.hue, n.surfaceSat, 88.6),
    "surface-dim": neutralHex(n.hue, n.surfaceSat, 84.5),
    "surface-bright": neutralHex(n.hue, n.surfaceSat, 98.2),
    outline: neutralHex(n.hue, n.textSat * 0.35, 45),
    "outline-variant": neutralHex(n.hue, n.textSat * 0.28, 78),
    "inverse-surface": inverseSurface,
    "inverse-on-surface": inverseOnSurface,
    "surface-tint": surfaceTint,
  };
}

export function applyTheme(el: HTMLElement, tokens: ThemeTokens): void {
  for (const [key, value] of Object.entries(tokens)) {
    el.style.setProperty(`--${key}`, value);
  }
}