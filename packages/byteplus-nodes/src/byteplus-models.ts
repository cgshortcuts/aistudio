/**
 * ModelArk Seedance model ids.
 *
 * 2.0 ids are published in BytePlus ModelArk docs. 2.5 product pages exist, but
 * the console-owned id can differ by account — override with
 * `BYTEPLUS_SEEDANCE_25_MODEL` when your project lists a different string.
 */

export const SEEDANCE_20_STANDARD = "dreamina-seedance-2-0-260128";
export const SEEDANCE_20_FAST = "dreamina-seedance-2-0-fast-260128";
export const SEEDANCE_20_MINI = "dreamina-seedance-2-0-mini-260615";

/** Provisional default — confirm in your ModelArk console / catalog. */
export const SEEDANCE_25_MODEL_ID_DEFAULT = "dreamina-seedance-2-5-260628";

export const SEEDANCE_25_MODEL_ENV = "BYTEPLUS_SEEDANCE_25_MODEL";

export function resolveSeedance25ModelId(
  fallback: string = SEEDANCE_25_MODEL_ID_DEFAULT
): string {
  const fromEnv = process.env[SEEDANCE_25_MODEL_ENV]?.trim();
  return fromEnv || fallback;
}

export function resolveModelId(
  modelId: string,
  modelIdEnv?: string | null
): string {
  if (modelIdEnv === SEEDANCE_25_MODEL_ENV) {
    return resolveSeedance25ModelId(modelId);
  }
  if (modelIdEnv) {
    const fromEnv = process.env[modelIdEnv]?.trim();
    if (fromEnv) return fromEnv;
  }
  return modelId;
}
