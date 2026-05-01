import type { PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot.ts";

export interface PlayerViewModel {
  key: string;
  visible: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export function presentPlayer(snapshot: PlayerRenderSnapshot): PlayerViewModel {
  return {
    key: "player",
    visible: snapshot.exists,
    x: snapshot.x,
    y: snapshot.y,
    hp: snapshot.hp,
    maxHp: snapshot.maxHp,
  };
}
