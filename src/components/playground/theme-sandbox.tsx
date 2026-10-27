"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ACCENT_PRESETS,
  DEFAULT_THEME,
  DOMINANT_PRESETS,
  SUPPORTING_TONES,
  SUPPORTING_TONE_LABELS,
  applyTheme,
  generatePalette,
  type EcosystemThemeConfig,
  type SupportingTone,
} from "@/lib/theme";
import {
  mockCurricula,
  mockEcosystem,
  mockMembers,
  mockSpaces,
} from "@/lib/playground/mock";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const TOKEN_KEYS = [
  "primary",
  "secondary",
  "accent",
  "tertiary",
  "background",
  "card",
  "muted",
  "border",
] as const;

function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ThemeSandbox() {
  const [config, setConfig] = useState<EcosystemThemeConfig>({
    badgeUrl: null,
    primary: DEFAULT_THEME.primary,
    supporting: DEFAULT_THEME.supporting,
    accent: DEFAULT_THEME.accent,
  });

  const palette = useMemo(() => generatePalette(config), [config]);

  useEffect(() => {
    applyTheme(document.documentElement, palette);
  }, [palette]);

  const setPrimary = (value: string) =>
    setConfig((prev) => ({ ...prev, primary: value }));
  const setSupporting = (value: SupportingTone) =>
    setConfig((prev) => ({ ...prev, supporting: value }));
  const setAccent = (value: string | null) =>
    setConfig((prev) => ({ ...prev, accent: value }));

  const space = mockSpaces[0];
  const curriculum = mockCurricula[0];
  const initials = mockEcosystem.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
      {/* Controls */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Theme controls</CardTitle>
          <CardDescription>
            Applies <code className="font-mono text-xs">applyTheme</code> live to
            the whole page — every token below resolves to this config.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ControlGroup label="Dominant color (primary brand)">
            <div className="flex flex-wrap items-center gap-2">
              {DOMINANT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setPrimary(preset.value)}
                  className={`size-8 rounded-full transition-transform hover:scale-110 ${
                    config.primary?.toLowerCase() === preset.value.toLowerCase()
                      ? "ring-2 ring-primary ring-offset-2"
                      : "ring-1 ring-border"
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <input
                type="color"
                value={config.primary ?? "#000000"}
                onChange={(e) => setPrimary(e.target.value)}
                className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={config.primary ?? ""}
                onChange={(e) =>
                  HEX_RE.test(e.target.value) && setPrimary(e.target.value)
                }
                className="w-24 rounded border bg-background px-1.5 py-0.5 font-mono text-xs"
              />
            </div>
          </ControlGroup>

          <ControlGroup label="Supporting tone">
            <div className="flex flex-wrap gap-2">
              {SUPPORTING_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setSupporting(tone)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    config.supporting === tone
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {SUPPORTING_TONE_LABELS[tone]}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="Accent highlight">
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((preset) => {
                const isActive = config.accent === preset.value;
                const swatch = preset.swatch ?? preset.value ?? "#8c9eff";
                return (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() => setAccent(preset.value)}
                    className={`size-8 rounded-full transition-transform hover:scale-110 ${
                      isActive ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-border"
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                );
              })}
            </div>
          </ControlGroup>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Resolved token values</Label>
            <ul className="grid grid-cols-2 gap-1.5">
              {TOKEN_KEYS.map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-1 font-mono text-[11px]"
                >
                  <span className="truncate text-muted-foreground">{key}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/10"
                      style={{ backgroundColor: palette[key] }}
                    />
                    {palette[key]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setConfig({
                  badgeUrl: null,
                  primary: DEFAULT_THEME.primary,
                  supporting: DEFAULT_THEME.supporting,
                  accent: DEFAULT_THEME.accent,
                })
              }
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setConfig({
                  badgeUrl: null,
                  primary: mockEcosystem.theme_primary,
                  supporting:
                    SUPPORTING_TONES.includes(mockEcosystem.theme_supporting as SupportingTone)
                      ? (mockEcosystem.theme_supporting as SupportingTone)
                      : DEFAULT_THEME.supporting,
                  accent: mockEcosystem.theme_accent,
                })
              }
            >
              Apply mock school theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live preview against real feature components */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold tracking-tight">
                    {mockEcosystem.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{mockEcosystem.vision}</p>
                </div>
              </div>
              <Badge variant="secondary">Primary School</Badge>
            </header>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm">New lesson</Button>
              <Button size="sm" variant="secondary">
                Members
              </Button>
              <Button size="sm" variant="outline">
                Curriculum
              </Button>
              <Button size="sm" variant="destructive">
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{space.name}</CardTitle>
              <CardDescription>
                {space.ecosystems?.name} · {space.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {mockMembers.slice(0, 5).map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm font-medium">{member.display_name}</span>
                    <Badge variant="secondary">{member.role}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{curriculum.name}</CardTitle>
              <CardDescription>
                {curriculum.grades.length} grades · {curriculum.grades.reduce(
                  (sum, grade) => sum + grade.terms.length, 0,
                )}{" "}
                terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pg-theme-note" className="text-xs text-muted-foreground">
                  Progress note
                </Label>
                <Input id="pg-theme-note" placeholder="Solid progress this term…" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Achievement:</span>
                <Badge variant="outline">42%</Badge>
                <Badge>On track</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
          <span className="size-3 shrink-0 animate-pulse rounded-full bg-secondary" />
          <p className="text-muted-foreground">
            This whole preview skin re-derives in real time. Tune a school palette
            here, then drop the config into{" "}
            <code className="font-mono text-xs">EcosystemThemeProvider</code>.
          </p>
        </div>
      </div>
    </div>
  );
}