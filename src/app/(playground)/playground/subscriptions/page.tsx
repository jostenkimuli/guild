import { Badge } from "@/components/ui/badge";
import { EcosystemSubscriptions } from "@/components/playground/ecosystem-subscriptions";
import type { ComponentManifest } from "@/lib/curriculum-spine/manifest";
import {
  buildStandardRegistry,
  componentCoverageCount,
  computeComponentCoverage,
  findRootDocuments,
} from "@/lib/curriculum-spine/registry";
import {
  getMockSubscriptionsForEcosystem,
  mockEcosystem,
  mockEcosystemBright,
  mockStandardDocuments,
  type MockStandardDocument,
} from "@/lib/playground/mock";
import { createServiceClient } from "@/lib/supabase/service";

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asYear(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

export default async function SubscriptionsPage() {
  let documents: MockStandardDocument[] = [];
  let source: "database" | "mock" = "mock";

  try {
    const supabase = createServiceClient();
    const [typesResult, nodesResult] = await Promise.all([
      supabase
        .from("node_types")
        .select(
          "type_id, type_name, category, payload_schema, allowed_children, is_root",
        ),
      supabase
        .from("curriculum_nodes")
        .select(
          "curriculum_node_id, parent_node_id, type_id, title, code, order_index, status, published_at, payload",
        ),
    ]);
    if (typesResult.error) throw typesResult.error;
    if (nodesResult.error) throw nodesResult.error;

    const registry = buildStandardRegistry(
      typesResult.data ?? [],
      nodesResult.data ?? [],
    );
    const roots = findRootDocuments(registry.nodes, registry.types);
    if (roots.length > 0) {
      source = "database";
      documents = roots.map((root) => {
        const manifest = (root.payload.component_manifest ??
          null) as ComponentManifest | null;
        const coverage = componentCoverageCount(
          computeComponentCoverage(root, registry.nodes, manifest),
        );
        return {
          code: root.code ?? `document-${root.id}`,
          title: root.title,
          type_name: root.typeName,
          country: asText(root.payload.country),
          year: asYear(root.payload.year),
          status: root.status,
          coverage,
        };
      });
    }
  } catch {
    // Registry not reachable — the mock catalog keeps the preview alive.
  }

  if (documents.length === 0) {
    documents = mockStandardDocuments;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Standard subscriptions
          </h2>
          <Badge variant="secondary">Ecosystem admin · adoption</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          An ecosystem subscribes to a standard document once and every space
          inside it follows it. Subscription state is mocked; the picker reads
          real registry roots from <code>public.curriculum_nodes</code> when
          available, otherwise it falls back to the mock catalog.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <EcosystemSubscriptions
          ecosystem={mockEcosystem}
          documents={documents}
          initialSubscriptions={getMockSubscriptionsForEcosystem(mockEcosystem.id)}
          adminName="Lena Achieng"
          spacesCount={2}
        />
        <EcosystemSubscriptions
          ecosystem={mockEcosystemBright}
          documents={documents}
          initialSubscriptions={getMockSubscriptionsForEcosystem(
            mockEcosystemBright.id,
          )}
          adminName="Marcus Feld"
          spacesCount={1}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Picker source: {source} · {documents.length} documents loaded
      </p>
    </div>
  );
}