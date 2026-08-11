import { renderHook, act } from "@testing-library/react";
import { useVideoRecorder } from "../useVideoRecorder";

// Mock the dependencies
jest.mock("../../../serverState/useAssetUpload", () => ({
  useAssetUpload: () => ({
    uploadAsset: jest.fn()
  })
}));

jest.mock("../../../contexts/NodeContext", () => ({
  useNodes: (selector: (state: { workflow: { id: string; name: string } }) => unknown) =>
    selector({
      workflow: {
        id: "test-workflow-id",
        name: "Test Workflow"
      }
    })
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
const mockEnumerateDevices = jest.fn();

Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices
  },
  writable: true
});

describe("useVideoRecorder", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockReset();
    mockEnumerateDevices.mockReset();
  });

  it("initializes with camera disabled and does not probe devices", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    expect(result.current.isCameraEnabled).toBe(false);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPreviewing).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isDeviceListVisible).toBe(false);
    expect(result.current.videoInputDevices).toEqual([]);
    expect(result.current.audioInputDevices).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });

  it("probes devices only after enableCamera", async () => {
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    });
    mockEnumerateDevices.mockResolvedValue([
      {
        kind: "videoinput",
        deviceId: "cam-1",
        label: "Camera 1"
      }
    ]);

    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    await act(async () => {
      result.current.enableCamera();
    });

    expect(result.current.isCameraEnabled).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
  });

  it("maps device-not-found to a single clear message", async () => {
    const notFound = new Error("Requested device not found");
    (notFound as Error & { name: string }).name = "NotFoundError";
    mockGetUserMedia.mockRejectedValue(notFound);

    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    await act(async () => {
      result.current.enableCamera();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("No video input devices found.");
  });

  it("provides handleRecord function", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    expect(typeof result.current.handleRecord).toBe("function");
  });

  it("provides startPreview function", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    expect(typeof result.current.startPreview).toBe("function");
  });

  it("provides stopStream function", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    expect(typeof result.current.stopStream).toBe("function");
  });

  it("toggles device list visibility", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    expect(result.current.isDeviceListVisible).toBe(false);

    act(() => {
      result.current.toggleDeviceListVisibility();
    });

    expect(result.current.isDeviceListVisible).toBe(true);

    act(() => {
      result.current.toggleDeviceListVisibility();
    });

    expect(result.current.isDeviceListVisible).toBe(false);
  });

  it("handles video device change", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    act(() => {
      result.current.handleVideoDeviceChange("test-video-device-id");
    });

    expect(result.current.selectedVideoDeviceId).toBe("test-video-device-id");
  });

  it("handles audio device change", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    act(() => {
      result.current.handleAudioDeviceChange("test-audio-device-id");
    });

    expect(result.current.selectedAudioDeviceId).toBe("test-audio-device-id");
  });

  it("sets error when no stream available and trying to record", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    act(() => {
      result.current.handleRecord();
    });

    expect(result.current.error).toBe(
      "No video stream available. Start preview first."
    );
  });

  it("provides videoRef for video element attachment", () => {
    const { result } = renderHook(() =>
      useVideoRecorder({ onChange: mockOnChange })
    );

    expect(result.current.videoRef).toBeDefined();
    expect(result.current.videoRef.current).toBeNull();
  });
});
