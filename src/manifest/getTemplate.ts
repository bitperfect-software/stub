import { findTemplate } from "manifest/findTemplate.ts";
import type { Manifest, TemplateDefinition } from "manifest/manifestSchema.ts";

/**
 * Central lookup, because a manifest may name a template that does not exist — `requires` often
 * does — and every caller that needs one needs the same error.
 */
export const getTemplate = (manifest: Manifest, templateName: string): TemplateDefinition => {
    const definition = findTemplate(manifest, templateName);

    if (!definition) throw new Error(`Unknown template ${templateName}`);

    return definition;
};
