import { PrimitivesDemo } from "@/components/playground/primitives-demo";

export default function PrimitivesPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Primitives</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every shadcn UI building block in one place — shapes, hierarchy and
          token usage at a glance.
        </p>
      </section>
      <PrimitivesDemo />
    </div>
  );
}