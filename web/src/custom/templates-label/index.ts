/**
 * User-visible name for the shipped-workflow gallery.
 * Internal ids, routes, and APIs stay `examples`.
 */
export const TEMPLATES_PAGE_TITLE = "Templates";
export const TEMPLATES_PAGE_SUBTITLE =
  "Browse template workflows and start from one.";
export const BROWSE_TEMPLATES_LABEL = "Browse templates";

export function templatesCountLabel(count: number): string {
  return `${count} template${count === 1 ? "" : "s"}`;
}
