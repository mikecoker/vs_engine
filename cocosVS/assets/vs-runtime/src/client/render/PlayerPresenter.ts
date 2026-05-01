import type { PlayerRenderSnapshot } from "../../sim/core/RenderSnapshot.ts";

export interface PlayerViewModel {
  key: string;
  visible: boolean;
  spriteKey: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export function presentPlayer(snapshot: PlayerRenderSnapshot): PlayerViewModel {
  return {
    key: "player",
    visible: snapshot.exists,
    spriteKey: "player_witch",
    x: snapshot.x,
    y: snapshot.y,
    hp: snapshot.hp,
    maxHp: snapshot.maxHp,
  };
}
