import type {
  PassiveUpgradeId,
  PlayerCharacterId,
  WeaponId,
} from "./ContentIds.ts";

export interface SimulationRunSaveData {
  readonly version: number;
  readonly selectedPlayerId: PlayerCharacterId;
  readonly elapsedSeconds: number;
  readonly currentLevel: number;
  readonly currentXp: number;
  readonly equippedWeaponIds: readonly WeaponId[];
}

export interface MetaUnlockSaveData {
  readonly unlockedPlayerIds: readonly PlayerCharacterId[];
  readonly unlockedWeaponIds: readonly WeaponId[];
  readonly unlockedPassiveUpgradeIds: readonly PassiveUpgradeId[];
  readonly passiveUpgradeLevels: Readonly<Record<PassiveUpgradeId, number>>;
}

export interface UserSettingsSaveData {
  readonly masterVolume: number;
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly screenShakeEnabled: boolean;
}

export interface SaveData {
  readonly version: number;
  readonly meta: MetaUnlockSaveData;
  readonly settings: UserSettingsSaveData;
  readonly lastRun: SimulationRunSaveData | null;
}
