import { findTemplate } from "manifest/findTemplate.ts";
import type { Manifest } from "manifest/manifestSchema.ts";

/**
 * The template plus everything it requires, transitively, depth-first, pre-order, each name once.
 *
 * That de-duplication is also what breaks `requires` cycles, so it replaces the process-wide
 * "already rendered" set this tool used to keep. Names absent from the manifest are returned as
 * leaves — the caller decides whether that is an error (rendering) or a no-op (option collection).
 */
export const resolveTemplateChain = (manifest: Manifest, rootName: string): Array<string> => {
    const visit = (templateName: string, visited: Set<string>): Array<string> => {
        if (visited.has(templateName)) return [];
        visited.add(templateName);

        const requires = findTemplate(manifest, templateName)?.requires ?? [];

        return [templateName, ...requires.flatMap((requiredName) => visit(requiredName, visited))];
    };

    return visit(rootName, new Set<string>());
};
