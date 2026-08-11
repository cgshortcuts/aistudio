import { expectedUpdatedAtForSave } from "../expectedUpdatedAtForSave";

describe("expectedUpdatedAtForSave", () => {
  it("omits the CAS token for a never-saved workflow", () => {
    expect(
      expectedUpdatedAtForSave({
        updated_at: "2026-08-11T00:00:00.000Z"
      })
    ).toBeUndefined();
  });

  it("sends the server revision once the workflow has an etag", () => {
    expect(
      expectedUpdatedAtForSave({
        etag: "rev-1",
        updated_at: "2026-08-11T00:00:00.000Z"
      })
    ).toBe("2026-08-11T00:00:00.000Z");
  });
});
