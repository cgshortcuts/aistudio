import { mimeTypeFromFilename, withMimeType } from "../mimeFromFilename";

describe("mimeFromFilename", () => {
  it("maps common video extensions", () => {
    expect(mimeTypeFromFilename("clip.mp4")).toBe("video/mp4");
    expect(mimeTypeFromFilename("clip.MOV")).toBe("video/quicktime");
    expect(mimeTypeFromFilename("clip.webm")).toBe("video/webm");
  });

  it("falls back for unknown extensions", () => {
    expect(mimeTypeFromFilename("archive.bin")).toBe("application/octet-stream");
  });

  it("withMimeType leaves usable MIME alone", () => {
    const file = new File(["x"], "a.mp4", { type: "video/mp4" });
    expect(withMimeType(file)).toBe(file);
  });

  it("withMimeType fills empty MIME from the filename", () => {
    const file = new File(["x"], "a.mp4", { type: "" });
    const next = withMimeType(file);
    expect(next).not.toBe(file);
    expect(next.type).toBe("video/mp4");
    expect(next.name).toBe("a.mp4");
  });
});
