export interface AsciiPalette {
  readonly empty: string;
  readonly player: string;
  readonly enemy: string;
  readonly projectile: string;
  readonly pickup: string;
}

export const DEFAULT_ASCII_PALETTE: AsciiPalette = {
  empty: ".",
  player: "@",
  enemy: "e",
  projectile: "*",
  pickup: "x",
};
