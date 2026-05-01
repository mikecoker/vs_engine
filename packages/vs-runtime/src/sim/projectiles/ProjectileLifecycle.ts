import type { ProjectileStore } from "./ProjectileStore";

export function releaseProjectile(store: ProjectileStore, slot: number): boolean {
  return store.release(slot);
}

