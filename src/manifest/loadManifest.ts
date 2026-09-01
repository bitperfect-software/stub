import { readJsonFile } from "io/readJsonFile.ts";
import { parseManifest } from "manifest/parseManifest.ts";
import type { Manifest } from "manifest/manifestSchema.ts";

export const loadManifest = (manifestPath: string): Manifest => parseManifest(readJsonFile(manifestPath), manifestPath);
