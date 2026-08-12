import { imageFileFromClipboardEvent } from "../imageFileFromClipboardEvent";

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

function pasteEvent(partial: {
  items?: Array<{ kind: string; type: string; getAsFile: () => File | null }>;
  files?: File[];
}): ClipboardEvent {
  return {
    clipboardData: {
      items: partial.items ?? [],
      files: partial.files ?? []
    }
  } as unknown as ClipboardEvent;
}

describe("imageFileFromClipboardEvent", () => {
  it("reads an image file from clipboard items", () => {
    const file = new File([PNG_BYTES], "paste.png", { type: "image/png" });
    const event = pasteEvent({
      items: [{ kind: "file", type: "image/png", getAsFile: () => file }]
    });

    expect(imageFileFromClipboardEvent(event)).toBe(file);
  });

  it("reads an image from clipboard files when items are empty", () => {
    const file = new File([PNG_BYTES], "paste.png", { type: "image/png" });
    const event = pasteEvent({ files: [file] });

    expect(imageFileFromClipboardEvent(event)).toBe(file);
  });

  it("ignores empty image payloads", () => {
    const file = new File([], "paste.png", { type: "image/png" });
    const event = pasteEvent({
      items: [{ kind: "file", type: "image/png", getAsFile: () => file }]
    });

    expect(imageFileFromClipboardEvent(event)).toBeNull();
  });

  it("returns null when the clipboard has no image", () => {
    const event = pasteEvent({
      items: [{ kind: "string", type: "text/plain", getAsFile: () => null }]
    });

    expect(imageFileFromClipboardEvent(event)).toBeNull();
  });
});
