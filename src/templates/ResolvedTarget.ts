/**
 * One manifest entry's resolved output, as `{% path %}` and `{% reference %}` see it.
 *
 * Produced by `render/resolveTemplateTargets.ts` before any body renders, so the path a body reads
 * is the same value the run writes to.
 */
export interface ResolvedTarget {
    /** The target file, project-root-relative: the entry's rendered `path`. */
    readonly path: string;
    /** The rendered named `reference` formats, empty unless the manifest declares several. */
    readonly references: Record<string, string>;
    /** What `{% reference %}` emits when it names no format, or null when the manifest declares none. */
    readonly defaultReference: string | null;
}
