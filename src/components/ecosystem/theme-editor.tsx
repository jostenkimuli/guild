"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { updateEcosystemTheme } from "@/app/actions/ecosystem-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  uploadBadge,
  removeBadge,
  validateBadgeFile,
} from "@/lib/ecosystem-theme";
import {
  DEFAULT_THEME,
  DOMINANT_PRESETS,
  ACCENT_PRESETS,
  SUPPORTING_TONES,
  SUPPORTING_TONE_LABELS,
  generatePalette,
  type SupportingTone,
} from "@/lib/theme";

type EcosystemRow = {
  id: string;
  slug: string;
  name: string;
  vision: string | null;
  mission: string | null;
  badge_url: string | null;
  theme_primary: string | null;
  theme_supporting: string | null;
  theme_accent: string | null;
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function toStyle(palette: Record<string, string>): React.CSSProperties {
  return Object.fromEntries(
    Object.entries(palette).map(([k, v]) => [`--${k}`, v]),
  ) as React.CSSProperties;
}

export function ThemeEditor({
  ecosystem,
  onSuccess,
}: {
  ecosystem: EcosystemRow;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, action, pending] = useActionState(updateEcosystemTheme, {
    success: false,
  });

  const [name, setName] = useState(ecosystem.name);
  const [vision, setVision] = useState(ecosystem.vision ?? "");
  const [mission, setMission] = useState(ecosystem.mission ?? "");
  const [primary, setPrimary] = useState<string>(
    ecosystem.theme_primary ?? DEFAULT_THEME.primary ?? "#0040e0",
  );
  const [supporting, setSupporting] = useState<SupportingTone>(
    (SUPPORTING_TONES as readonly string[]).includes(
      ecosystem.theme_supporting ?? "",
    )
      ? (ecosystem.theme_supporting as SupportingTone)
      : (DEFAULT_THEME.supporting ?? "modern_blue"),
  );
  const [accent, setAccent] = useState<string | null>(
    ecosystem.theme_accent ?? null,
  );
  const [badgePreview, setBadgePreview] = useState<string | null>(
    ecosystem.badge_url,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const previewCfg = useMemo(
    () => ({
      badgeUrl: badgePreview,
      primary: primary || null,
      supporting,
      accent,
    }),
    [badgePreview, primary, supporting, accent],
  );
  const previewPalette = useMemo(() => generatePalette(previewCfg), [previewCfg]);

  const handledSuccess = useRef(false);
  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      router.refresh();
      onSuccess?.();
    }
  }, [state.success, onSuccess, router]);

  const handleBadge = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const invalid = validateBadgeFile(file);
    if (invalid) {
      setUploadError(invalid);
      return;
    }
    setUploading(true);
    const result = await uploadBadge(createBrowserClient(), ecosystem.id, file);
    setUploading(false);
    if ("error" in result) {
      setUploadError(result.error ?? "Upload failed.");
      return;
    }
    setBadgePreview(result.url!);
  };

  const handleBadgeRemove = async () => {
    await removeBadge(createBrowserClient(), ecosystem.id);
    setBadgePreview(null);
  };

  const badgeInitials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const resolveAccent = (preset: string | null) => preset;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            School Profile &amp; Theme Customization
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your institution identity, visual branding and dynamic color
            system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setPrimary(DEFAULT_THEME.primary ?? "#0040e0");
              setSupporting(DEFAULT_THEME.supporting ?? "modern_blue");
              setAccent(DEFAULT_THEME.accent ?? null);
            }}
          >
            Reset to Default
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || uploading}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {pending ? "Saving…" : "Save & Apply Theme"}
          </Button>
        </div>
      </div>

      {/* Grid: left (7) + right (5) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        {/* ---- Left column ---- */}
        <div className="space-y-5 md:col-span-7">
          {/* School Profile & Badge */}
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <span className="text-primary">🏫</span> School Profile &amp; Badge
            </h3>
            <form ref={formRef} action={action} className="space-y-4">
              <input type="hidden" name="ecosystem_id" value={ecosystem.id} />
              <input type="hidden" name="theme_primary" value={primary} />
              <input
                type="hidden"
                name="theme_supporting"
                value={supporting}
              />
              <input
                type="hidden"
                name="theme_accent"
                value={accent ?? ""}
              />
              <input
                type="hidden"
                name="badge_url"
                value={badgePreview ?? ""}
              />

              <div className="space-y-1.5">
                <Label htmlFor="theme-name">School name</Label>
                <Input
                  id="theme-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="theme-vision">Vision statement</Label>
                  <Textarea
                    id="theme-vision"
                    name="vision"
                    rows={2}
                    maxLength={1000}
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="theme-mission">Mission statement</Label>
                  <Textarea
                    id="theme-mission"
                    name="mission"
                    rows={2}
                    maxLength={1000}
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                  />
                </div>
              </div>

              {/* Badge area */}
              <div className="space-y-2">
                <Label>School crest / badge</Label>
                <div className="flex items-center gap-4 rounded-lg border border-dashed p-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-semibold text-muted-foreground">
                    {badgePreview ? (
                      <img
                        src={badgePreview}
                        alt="School crest"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      badgeInitials
                    )}
                  </div>
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() =>
                        document.getElementById("badge-file-input")?.click()
                      }
                    >
                      {uploading ? "Uploading…" : "Upload New Crest"}
                    </Button>
                    {badgePreview ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleBadgeRemove}
                        disabled={uploading}
                      >
                        Remove
                      </Button>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or SVG up to 5 MB.
                    </p>
                    {uploadError ? (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    ) : null}
                  </div>
                </div>
                <input
                  id="badge-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleBadge}
                />
              </div>
            </form>
          </section>

          {/* Theme Customization Engine */}
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <span className="text-primary">🎨</span> Theme Customization
              Engine
            </h3>
            <div className="space-y-5">
              {/* Dominant color */}
              <div>
                <Label className="mb-2">Dominant color (primary brand)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {DOMINANT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      title={p.label}
                      onClick={() => setPrimary(p.value)}
                      className={`size-10 rounded-full transition-transform hover:scale-110 ${
                        primary.toLowerCase() === p.value.toLowerCase()
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-border"
                      }`}
                      style={{ backgroundColor: p.value }}
                    />
                  ))}
                  <div className="flex items-center gap-2 pl-2">
                    <input
                      type="color"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={primary}
                      onChange={(e) =>
                        HEX_RE.test(e.target.value) &&
                        setPrimary(e.target.value)
                      }
                      className="w-20 rounded border bg-background px-1.5 py-0.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Supporting tone */}
              <div>
                <Label className="mb-2">Supporting tone</Label>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTING_TONES.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSupporting(tone)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        supporting === tone
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {SUPPORTING_TONE_LABELS[tone]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent highlights */}
              <div>
                <Label className="mb-2">Accent highlights</Label>
                <div className="flex gap-3">
                  {ACCENT_PRESETS.map((preset) => {
                    const isActive =
                      accent === resolveAccent(preset.value);
                    const swatchColor =
                      preset.swatch ?? preset.value ?? "#8c9eff";
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        title={preset.label}
                        onClick={() => setAccent(resolveAccent(preset.value))}
                        className={`size-8 rounded-full transition-transform hover:scale-110 ${
                          isActive
                            ? "ring-2 ring-primary ring-offset-2"
                            : "ring-1 ring-border"
                        }`}
                        style={{ backgroundColor: swatchColor }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ---- Right column: Live preview ---- */}
        <div className="flex flex-col md:col-span-5">
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
              <span className="text-primary">👁</span> Live Preview
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              See how your custom palette applies in real time across components.
            </p>
            <div
              className="space-y-4 rounded-xl border border-border/30 bg-muted/40 p-4"
              style={toStyle(previewPalette)}
            >
              {/* Sample card */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Sample Card Component</span>
                  <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  This container demonstrates your active primary color tokens
                  and card surfaces.
                </p>
                <div className="flex gap-2">
                  <span className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    Primary Action
                  </span>
                  <span className="rounded border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
                    Secondary
                  </span>
                </div>
              </div>
              {/* Notification */}
              <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-semibold">Notification Banner</h4>
                  <p className="text-xs text-muted-foreground">
                    Theme badge alert styling.
                  </p>
                </div>
                <span className="size-3 animate-pulse rounded-full bg-secondary" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}