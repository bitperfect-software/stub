/** One file a run intends to create. Produced without touching disk; consumed by `executeWritePlan`. */
export interface PlannedWrite {
    readonly templateName: string;
    /** Absolute, resolved against the project root. */
    readonly targetPath: string;
    readonly contents: string;
}
