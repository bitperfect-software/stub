import type { Tokenizer } from "liquidjs";

/**
 * Reads the single argument both path tags take.
 *
 * A manifest key names a template, it is not data, so only a quoted literal is accepted — which also
 * keeps every reference checkable without any input.
 */
export const readQuotedTemplateName = (tokenizer: Tokenizer, tagName: string): string => {
    const quoted = tokenizer.readQuoted();

    if (quoted === undefined) {
        throw tokenizer.error(`{% ${tagName} %} expects a quoted template name, e.g. {% ${tagName} "formData" %}`);
    }

    return quoted.content;
};
