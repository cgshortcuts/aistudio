/**
 * AiStudio product profile for the Electron shell (fork).
 *
 * Packaged builds default to `customer` (chat/agent surfaces off). Unpackaged
 * `npm run electron:dev` stays `full` unless `AISTUDIO_PRODUCT` is set.
 * An explicit `customer` or `full` always wins.
 */

export const AISTUDIO_PRODUCT_ENV = "AISTUDIO_PRODUCT";

export type AiStudioProduct = "customer" | "full";

export function resolveAiStudioProduct(
  isPackaged: boolean,
  env: NodeJS.ProcessEnv = process.env
): AiStudioProduct {
  const explicit = env[AISTUDIO_PRODUCT_ENV]?.trim();
  if (explicit === "full" || explicit === "customer") {
    return explicit;
  }
  return isPackaged ? "customer" : "full";
}
