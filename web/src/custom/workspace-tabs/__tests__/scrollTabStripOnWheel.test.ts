import { scrollTabStripOnWheel } from "../scrollTabStripOnWheel";

function makeStrip(options: {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft?: number;
}): HTMLDivElement {
  const element = document.createElement("div");
  Object.defineProperty(element, "scrollWidth", {
    value: options.scrollWidth,
    configurable: true
  });
  Object.defineProperty(element, "clientWidth", {
    value: options.clientWidth,
    configurable: true
  });
  element.scrollLeft = options.scrollLeft ?? 0;
  return element;
}

describe("scrollTabStripOnWheel", () => {
  it("maps a vertical wheel notch onto scrollLeft", () => {
    const strip = makeStrip({ scrollWidth: 800, clientWidth: 200, scrollLeft: 40 });

    const consumed = scrollTabStripOnWheel(strip, { deltaX: 0, deltaY: 120 });

    expect(consumed).toBe(true);
    expect(strip.scrollLeft).toBe(160);
  });

  it("scrolls left on wheel up", () => {
    const strip = makeStrip({ scrollWidth: 800, clientWidth: 200, scrollLeft: 80 });

    scrollTabStripOnWheel(strip, { deltaX: 0, deltaY: -50 });

    expect(strip.scrollLeft).toBe(30);
  });

  it("clamps to the scroll range", () => {
    const strip = makeStrip({ scrollWidth: 300, clientWidth: 200, scrollLeft: 90 });

    scrollTabStripOnWheel(strip, { deltaX: 0, deltaY: 80 });

    expect(strip.scrollLeft).toBe(100);
  });

  it("still consumes vertical wheel at the end so the canvas does not zoom", () => {
    const strip = makeStrip({ scrollWidth: 300, clientWidth: 200, scrollLeft: 100 });

    const consumed = scrollTabStripOnWheel(strip, { deltaX: 0, deltaY: 40 });

    expect(consumed).toBe(true);
    expect(strip.scrollLeft).toBe(100);
  });

  it("leaves a primarily horizontal gesture to native overflow", () => {
    const strip = makeStrip({ scrollWidth: 800, clientWidth: 200, scrollLeft: 10 });

    const consumed = scrollTabStripOnWheel(strip, { deltaX: 40, deltaY: 8 });

    expect(consumed).toBe(false);
    expect(strip.scrollLeft).toBe(10);
  });

  it("does nothing when every tab already fits", () => {
    const strip = makeStrip({ scrollWidth: 200, clientWidth: 200 });

    const consumed = scrollTabStripOnWheel(strip, { deltaX: 0, deltaY: 120 });

    expect(consumed).toBe(false);
    expect(strip.scrollLeft).toBe(0);
  });
});
