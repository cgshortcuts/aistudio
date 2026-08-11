import { render, screen } from "@testing-library/react";
import ExampleThumbnail from "../ExampleThumbnail";

describe("ExampleThumbnail", () => {
  it("renders a black tile with the image icon", () => {
    render(
      <ExampleThumbnail workflow={{ name: "Text to Image", tags: ["image"] }} />
    );
    const thumb = screen.getByTestId("example-thumbnail");
    expect(thumb).toHaveAttribute("data-kind", "imageGenerate");
  });

  it("renders the video kind for video examples", () => {
    render(
      <ExampleThumbnail workflow={{ name: "Text to Video", tags: ["video"] }} />
    );
    expect(screen.getByTestId("example-thumbnail")).toHaveAttribute(
      "data-kind",
      "videoGenerate"
    );
  });
});
