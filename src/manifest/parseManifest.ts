import { z } from "zod";
import { manifestSchema, type Manifest } from "manifest/manifestSchema.ts";

/** Pure: validates already-read data. `sourcePath` only appears in the error message. */
export const parseManifest = (data: unknown, sourcePath: string): Manifest => {
    const result = manifestSchema.safeParse(data);

    if (!result.success) throw new Error(`Invalid manifest ${sourcePath}\n${z.prettifyError(result.error)}`);

    return result.data;
};
