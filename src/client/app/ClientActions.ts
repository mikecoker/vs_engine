import type { ClientInputSource } from "../input/ClientInputSource";

export type ClientAction =
  | { type: "step"; frameSeconds: number; input: ClientInputSource }
  | { type: "capture" }
  | { type: "reset_run"; seed?: number }
  | { type: "select_upgrade"; choiceIndex: number };
