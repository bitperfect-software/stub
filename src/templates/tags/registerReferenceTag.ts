import {
    Tag,
    type Context,
    type Emitter,
    type Liquid,
    type TagToken,
    type Tokenizer,
    type TopLevelToken,
} from "liquidjs";
import type { ResolvedTarget } from "templates/ResolvedTarget.ts";
import { readQuotedTemplateName } from "templates/tags/readQuotedTemplateName.ts";
import { readResolvedTarget } from "templates/tags/readResolvedTarget.ts";

const tagName = "reference";

const argumentSyntax = `{% ${tagName} "formData" %} or {% ${tagName} "formData" as: "module" %}`;

/** The optional `as: "name"` argument. A literal, like the template name, so it stays checkable. */
const readFormatName = (tokenizer: Tokenizer): string | undefined => {
    tokenizer.skipBlank();

    if (tokenizer.end()) return undefined;

    if (tokenizer.match(",")) tokenizer.advance(1);

    tokenizer.assert(tokenizer.readIdentifier().content === "as", `${tagName} expects ${argumentSyntax}`);
    tokenizer.skipBlank();
    tokenizer.assert(tokenizer.match(":"), `${tagName} expects a ":" after "as"`);
    tokenizer.advance(1);

    const quoted = tokenizer.readQuoted();

    if (quoted === undefined) throw tokenizer.error(`${tagName} expects a quoted format name after "as:"`);

    tokenizer.skipBlank();
    tokenizer.assert(tokenizer.end(), `${tagName} expects ${argumentSyntax}`);

    return quoted.content;
};

/** Picks the format the manifest declares, and says what is on offer when the name does not match. */
const resolveReference = (target: ResolvedTarget, targetName: string, formatName: string | undefined): string => {
    const declared = Object.keys(target.references);
    const call = `{% ${tagName} "${targetName}"`;

    if (formatName === undefined) {
        if (target.defaultReference !== null) return target.defaultReference;
        // No format at all: the raw path is the only sensible reference to a file.
        if (declared.length === 0) return target.path;

        throw new Error(
            `${call} %} needs a format name — templates.json declares ${declared.join(", ")}, so write ${call} as: "${declared[0]}" %}`,
        );
    }

    const reference = target.references[formatName];

    if (reference !== undefined) return reference;

    if (declared.length === 0) {
        throw new Error(
            target.defaultReference === null
                ? `${call} as: "${formatName}" %} but templates.json declares no reference formats`
                : `${call} as: "${formatName}" %} but templates.json declares a single unnamed format, so drop the "as:"`,
        );
    }

    throw new Error(
        `${call} as: "${formatName}" %} is not a declared reference format — templates.json declares ${declared.join(", ")}`,
    );
};

/**
 * `{% reference "formData" %}` -> how another manifest entry's target file is referred to, per the
 * `reference` formats in `templates.json`; the raw path when the manifest declares none.
 *
 * The formats themselves are rendered in `render/resolveTemplateTargets.ts`, so what `stub` knows is
 * "a target has named renderings" — never what an alias or a module specifier is.
 */
export const registerReferenceTag = (engine: Liquid) => {
    engine.registerTag(
        tagName,
        class extends Tag {
            private readonly targetName: string;
            private readonly formatName: string | undefined;

            constructor(token: TagToken, remainingTokens: Array<TopLevelToken>, liquid: Liquid) {
                super(token, remainingTokens, liquid);

                this.targetName = readQuotedTemplateName(this.tokenizer, tagName);
                this.formatName = readFormatName(this.tokenizer);
            }

            // Plain and synchronous, never `async`: every render in this tool goes through Liquid's
            // sync entry points, which would never await a returned promise.
            override render(ctx: Context, emitter: Emitter) {
                const target = readResolvedTarget(ctx, tagName, this.targetName);

                emitter.write(resolveReference(target, this.targetName, this.formatName));
            }
        },
    );
};
