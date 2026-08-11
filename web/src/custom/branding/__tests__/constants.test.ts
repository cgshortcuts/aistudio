import {
  APP_DISPLAY_NAME,
  APP_PRODUCT_NAME
} from "../constants";

describe("AiStudio branding constants", () => {
  it("keeps the technical product name without a space", () => {
    expect(APP_PRODUCT_NAME).toBe("AiStudio");
  });

  it("uses a spaced display name for user-facing copy", () => {
    expect(APP_DISPLAY_NAME).toBe("Ai Studio");
  });
});
