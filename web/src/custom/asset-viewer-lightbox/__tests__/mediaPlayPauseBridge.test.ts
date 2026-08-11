import {
  registerMediaPlayToggle,
  toggleRegisteredMediaPlay
} from "../mediaPlayPauseBridge";

describe("mediaPlayPauseBridge", () => {
  afterEach(() => {
    registerMediaPlayToggle(null);
  });

  it("returns false when nothing is registered", () => {
    expect(toggleRegisteredMediaPlay()).toBe(false);
  });

  it("invokes the registered toggle and returns true", () => {
    const toggle = jest.fn();
    registerMediaPlayToggle(toggle);
    expect(toggleRegisteredMediaPlay()).toBe(true);
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("clears the toggle on null registration", () => {
    const toggle = jest.fn();
    registerMediaPlayToggle(toggle);
    registerMediaPlayToggle(null);
    expect(toggleRegisteredMediaPlay()).toBe(false);
    expect(toggle).not.toHaveBeenCalled();
  });
});
