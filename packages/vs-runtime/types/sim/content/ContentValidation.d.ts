import type { AnyContentId } from "./ContentIds.ts";
import type { ContentBundle, ContentCollectionName } from "./ContentTypes.ts";
export interface ContentValidationIssue {
    readonly collection: ContentCollectionName;
    readonly id: string;
    readonly message: string;
}
export declare class ContentValidationError extends Error {
    readonly issues: readonly ContentValidationIssue[];
    constructor(issues: readonly ContentValidationIssue[]);
}
export declare function validateContentBundle(bundle: ContentBundle): void;
export declare function assertKnownContentId<TId extends AnyContentId>(ids: ReadonlySet<string>, collection: ContentCollectionName, ownerId: string, referencedId: TId): void;
//# sourceMappingURL=ContentValidation.d.ts.map