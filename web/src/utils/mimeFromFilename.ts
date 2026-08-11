/**
 * Infer a MIME type from a filename when the browser/OS leaves File.type empty
 * (common for some Windows video drops).
 */
const EXTENSION_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  aac: "audio/aac",
  pdf: "application/pdf"
};

export function mimeTypeFromFilename(
  filename: string,
  fallback = "application/octet-stream"
): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) {
    return fallback;
  }
  return EXTENSION_MIME[extension] ?? fallback;
}

/** Ensure a File has a usable MIME type before upload. */
export function withMimeType(file: File): File {
  if (file.type && file.type.includes("/")) {
    return file;
  }
  const mime = mimeTypeFromFilename(file.name);
  if (mime === file.type) {
    return file;
  }
  return new File([file], file.name, { type: mime });
}
