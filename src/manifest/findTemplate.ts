import type { Manifest, TemplateDefinition } from "manifest/manifestSchema.ts";

/**
 * One entry by name, or undefined. Every keyed lookup goes through here because `templates` comes
 * from `z.record` and therefore carries `Object.prototype`: a plain index would resolve a
 * `"requires": ["toString"]` to a function, which then fails much later as a `TypeError` blaming
 * stub rather than the manifest.
 */
export const findTemplate = (manifest: Manifest, templateName: string): TemplateDefinition | undefined =>
    Object.hasOwn(manifest.templates, templateName) ? manifest.templates[templateName] : undefined;
