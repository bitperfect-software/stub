/** The tool's own configuration. Not the user's manifest — that is `Manifest`. */
export interface Settings {
    /** Directory a project drops in to opt into stub; also the Liquid root. */
    readonly stubDirName: string;
    /** The manifest file inside the stub directory. */
    readonly manifestFileName: string;
    /** Implicit extension of template files, so a manifest key like "page" resolves to `page.liquid`. */
    readonly templateExtension: string;
}

export const defaultSettings: Settings = {
    stubDirName: ".stub",
    manifestFileName: "templates.json",
    templateExtension: ".liquid",
};
