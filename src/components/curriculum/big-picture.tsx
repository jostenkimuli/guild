import { ConsolePanel } from "@/components/console/panels";
import type { NationalAim } from "@/lib/curriculum/national";

const STEPS = [
  {
    title: "Aims",
    meaning: "Why children are taught. The broad goals of the nation.",
    example: "To develop discipline and good manners.",
  },
  {
    title: "Learning outcomes",
    meaning:
      "What a child should be able to do after a theme. Broad, like a life skill. Each outcome comes from the aims.",
    example:
      "Theme 7: The learner is able to identify people, relate and appreciate ways of living with them harmoniously.",
  },
  {
    title: "Competences",
    meaning:
      "Something a child can do that a teacher can see and check. Each competence comes from a learning outcome.",
    example: "Counting 1-5 using objects, e.g. stones, pictures.",
  },
];

function AimsList({ title, aims }: { title: string; aims: NationalAim[] }) {
  return (
    <details className="group rounded-lg border px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium">
        {title} ({aims.length})
      </summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {aims.map((aim) => (
          <li key={aim.id}>{aim.description}</li>
        ))}
      </ol>
    </details>
  );
}

export function BigPicture({ aims }: { aims: NationalAim[] }) {
  return (
    <ConsolePanel
      title="The big picture"
      description="How the curriculum is built, from the nation's goals down to what a child does in class."
      contentClassName="space-y-4"
    >
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step {index + 1}
            </p>
            <h3 className="mt-0.5 font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.meaning}</p>
            <p className="mt-2 border-l-2 pl-3 text-sm italic">{step.example}</p>
          </li>
        ))}
      </ol>
      <div className="grid gap-3 md:grid-cols-2">
        <AimsList
          title="National aims of education"
          aims={aims.filter((a) => a.kind === "national")}
        />
        <AimsList
          title="Aims of primary education"
          aims={aims.filter((a) => a.kind === "primary")}
        />
      </div>
    </ConsolePanel>
  );
}
