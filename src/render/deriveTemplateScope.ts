import type { Liquid } from "liquidjs";
import type { Manifest, TemplateDefinition } from "manifest/manifestSchema.ts";
import { deriveScope } from "render/deriveScope.ts";
import type { RenderScope } from "templates/renderLiquid.ts";

/**
 * What one template sees: the manifest globals plus its own computed, always derived from the raw
 * input and never from another template's scope.
 *
 * Shared by the write plan and by the target map, so the path `{% path %}` emits cannot drift from
 * the path the run writes.
 */
export const deriveTemplateScope = (
    engine: Liquid,
    manifest: Manifest,
    definition: TemplateDefinition,
    input: RenderScope,
): RenderScope => deriveScope(engine, [...manifest.computed, ...definition.computed], input);
