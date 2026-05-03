import { rm, stat, utimes, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clean = process.argv.includes("--clean");

const pathsToTouch = [
  "packages/vs-runtime/vs-runtime.es.js",
  "packages/vs-runtime/vs-runtime.es.js.map",
  "cocosVS/assets/scripts/VSGameRoot.ts",
  "cocosVS/assets/scripts/CocosInputState.ts",
];

async function touch(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const now = new Date();

  try {
    const current = await stat(absolutePath);
    await utimes(absolutePath, current.atime, now);
    console.log(`touched ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    await writeFile(absolutePath, "");
    console.log(`created ${relativePath}`);
  }
}

if (clean) {
  for (const relativePath of ["cocosVS/library", "cocosVS/temp"]) {
    await rm(path.join(repoRoot, relativePath), { recursive: true, force: true });
    console.log(`removed ${relativePath}`);
  }
}

for (const relativePath of pathsToTouch) {
  await touch(relativePath);
}

console.log(clean
  ? "Cocos refresh requested with cache cleanup. Restart Creator or preview so it rebuilds from disk."
  : "Cocos refresh requested. Restart preview if the running game does not hot-reload the bundle.");
