export function imageFileFromClipboardEvent(
  event: ClipboardEvent
): File | null {
  const data = event.clipboardData;
  if (!data) {
    return null;
  }

  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file && file.size > 0) {
        return file;
      }
    }
  }

  for (const file of Array.from(data.files ?? [])) {
    if (file.type.startsWith("image/") && file.size > 0) {
      return file;
    }
  }

  return null;
}
