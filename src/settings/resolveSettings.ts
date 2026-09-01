import { defaultSettings, type Settings } from "settings/defaultSettings.ts";

/**
 * The single place the tool's settings come from.
 *
 * Today: the built-in defaults. Later: layer user overrides (`~/.stub`, `package.json`,
 * `.stub/settings.json`) on top of `defaultSettings` here — the signature and every caller stay
 * unchanged.
 */
export const resolveSettings = (): Settings => defaultSettings;
