import { Tag, type Context, type Emitter, type Liquid, type TagToken, type TopLevelToken } from "liquidjs";
import { readQuotedTemplateName } from "templates/tags/readQuotedTemplateName.ts";
import { readResolvedTarget } from "templates/tags/readResolvedTarget.ts";

const tagName = "path";

/**
 * `{% path "formData" %}` -> the file another manifest entry writes to, project-root-relative, so a
 * body can point at a sibling's output instead of retyping its `path` expression.
 *
 * The tag only reads the map `render/resolveTemplateTargets.ts` resolved before any body rendered,
 * which is why `templates/` still needs to know nothing about the manifest.
 *
 * Subclassing liquidjs's abstract `Tag` is the one tag extension point that survives
 * `strictTypeChecked` — `createTagClass` is typed with `any` plus an index signature.
 */
export const registerPathTag = (engine: Liquid) => {
    engine.registerTag(
        tagName,
        class extends Tag {
            private readonly targetName: string;

            constructor(token: TagToken, remainingTokens: Array<TopLevelToken>, liquid: Liquid) {
                super(token, remainingTokens, liquid);

                this.targetName = readQuotedTemplateName(this.tokenizer, tagName);
                this.tokenizer.skipBlank();
                this.tokenizer.assert(this.tokenizer.end(), `{% ${tagName} %} takes exactly one argument`);
            }

            // Plain and synchronous, never `async`: every render in this tool goes through Liquid's
            // sync entry points, which would never await a returned promise.
            override render(ctx: Context, emitter: Emitter) {
                emitter.write(readResolvedTarget(ctx, tagName, this.targetName).path);
            }
        },
    );
};
