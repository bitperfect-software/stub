import { z } from "zod";

const namedDefinitionShape = { name: z.string(), description: z.string() };

/** A required input the user passes positionally. */
export const variableDefinitionSchema = z.object(namedDefinitionShape);

/** A value derived from the variables. `value` is a Liquid expression, overridable via `--name <value>`. */
export const computedDefinitionSchema = z.object({ ...namedDefinitionShape, value: z.string() });

/** A boolean flag that includes or excludes parts of the output. */
export const switchDefinitionSchema = z.object(namedDefinitionShape);

/**
 * Declarations are optional in the JSON but always present after parsing, so nothing downstream
 * has to fall back to an empty list.
 */
const declarationShape = {
    variables: z.array(variableDefinitionSchema).default([]),
    computed: z.array(computedDefinitionSchema).default([]),
    switches: z.array(switchDefinitionSchema).default([]),
};

/** One entry in `templates.json`. Describes a `.liquid` file; it is not the template itself. */
export const templateDefinitionSchema = z.object({
    ...declarationShape,
    /** Target file, itself rendered as a Liquid template, relative to the project root. */
    path: z.string(),
    description: z.string().optional(),
    /** Other templates rendered along with this one. */
    requires: z.array(z.string()).default([]),
});

export const manifestSchema = z.object({
    ...declarationShape,
    project: z.string().optional(), // parsed but currently unused; kept for format compatibility
    /**
     * How a template body refers to another template's target file, as a Liquid expression over
     * `targetPath` — read by `{% reference %}`. One unnamed format, or several named ones the tag
     * picks with `as: "name"`.
     */
    reference: z.union([z.string(), z.record(z.string(), z.string())]).default({}),
    templates: z.record(z.string(), templateDefinitionSchema),
});

export type VariableDefinition = z.infer<typeof variableDefinitionSchema>;
export type ComputedDefinition = z.infer<typeof computedDefinitionSchema>;
export type SwitchDefinition = z.infer<typeof switchDefinitionSchema>;
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
