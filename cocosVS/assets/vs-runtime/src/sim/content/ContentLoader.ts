import { createContentRegistry, type ContentRegistry } from "./ContentRegistry.ts";
import { prototypeContentBundle } from "./defs/index.ts";
import type { ContentBundle } from "./ContentTypes.ts";
import { validateContentBundle } from "./ContentValidation.ts";

export function loadValidatedContentRegistry(
  bundle: ContentBundle,
): ContentRegistry {
  validateContentBundle(bundle);
  return createContentRegistry(bundle);
}

export function loadPrototypeContentRegistry(): ContentRegistry {
  return loadValidatedContentRegistry(prototypeContentBundle);
}
