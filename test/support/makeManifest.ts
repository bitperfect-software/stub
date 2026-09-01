import { manifestSchema, type Manifest } from "manifest/manifestSchema.ts";

/**
 * Every manifest literal in a test goes through the real schema, so the `.default([])` entries are
 * genuinely applied and no test asserts against a shape production code would never see.
 */
export const makeManifest = (declaration: unknown): Manifest => manifestSchema.parse(declaration);
