export interface ResettableBuffer {
    clear(): void;
    readonly count: number;
}
export declare class ReusableCommandBuffer<T extends object> implements ResettableBuffer {
    private readonly createRecord;
    private readonly records;
    count: number;
    constructor(createRecord: () => T);
    protected nextRecord(): T;
    get(index: number): T;
    clear(): void;
    private createAndStoreRecord;
}
//# sourceMappingURL=ReusableCommandBuffer.d.ts.map