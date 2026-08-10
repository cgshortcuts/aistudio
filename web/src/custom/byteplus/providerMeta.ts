/**
 * Fork-only BytePlus ModelArk Settings card metadata.
 * Mounted into providerCatalog via CUSTOM FORK: BytePlus.
 */

import byteplusIcon from "./byteplus.png";

export const BYTEPLUS_PROVIDER_META = {
  key: "BYTEPLUS_API_KEY",
  name: "BytePlus ModelArk",
  description:
    "Seedance 2.0 / 2.5 video generation. Uses your ModelArk project key (resource packs and balance).",
  section: "media" as const,
  docsUrl: "https://docs.byteplus.com/en/docs/modelark/",
  icon: byteplusIcon,
  note: "Create the key in the ModelArk project that holds your active resource pack. ARK_API_KEY is also accepted."
};
