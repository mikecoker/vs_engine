import { createContentRegistry, type ContentRegistry } from "./ContentRegistry";
import { prototypeContentBundle } from "./defs";
import type { ContentBundle } from "./ContentTypes";
import { validateContentBundle } from "./ContentValidation";

export function loadValidatedContentRegistry(
  bundle: ContentBundle,
): ContentRegistry {
  validateContentBundle(bundle);
  return createContentRegistry(bundle);
}

export function loadPrototypeContentRegistry(): ContentRegistry {
  return loadValidatedContentRegistry(prototypeContentBundle);
}
