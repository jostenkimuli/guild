import { ThemeSandbox } from "@/components/playground/theme-sandbox";

export default function ThemePage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Theme</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fine-tune a per-ecosystem palette and preview it against real feature
          components before saving it to an ecosystem.
        </p>
      </section>
      <ThemeSandbox />
    </div>
  );
}