export interface ResettableBuffer {
  clear(): void;
  readonly count: number;
}

export class ReusableCommandBuffer<T extends object> implements ResettableBuffer {
  private readonly records: T[] = [];
  public count = 0;

  constructor(private readonly createRecord: () => T) {}

  protected nextRecord(): T {
    const record = this.records[this.count] ?? this.createAndStoreRecord();
    this.count += 1;
    return record;
  }

  public get(index: number): T {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`Command index ${index} is out of bounds for count ${this.count}.`);
    }

    return this.records[index];
  }

  public clear(): void {
    this.count = 0;
  }

  private createAndStoreRecord(): T {
    const record = this.createRecord();
    this.records.push(record);
    return record;
  }
}
