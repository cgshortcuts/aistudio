import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useRef, useState, useCallback } from "react";
import { useAssetUpload } from "../../serverState/useAssetUpload";
import { Asset } from "../../stores/ApiTypes";
import { useNodes } from "../../contexts/NodeContext";

export type VideoRecorderProps = {
  onChange: (asset: Asset) => void;
};

export type VideoDevice = {
  deviceId: string;
  label: string;
};

export interface VideoRecorderReturn {
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  handleRecord: () => void;
  isRecording: boolean;
  isPreviewing: boolean;
  isLoading: boolean;
  /** False until the user opts into camera access. */
  isCameraEnabled: boolean;
  enableCamera: () => void;
  disableCamera: () => void;
  startPreview: () => Promise<void>;
  stopStream: () => void;
  videoInputDevices: VideoDevice[];
  audioInputDevices: VideoDevice[];
  isDeviceListVisible: boolean;
  toggleDeviceListVisibility: () => void;
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  handleVideoDeviceChange: (deviceId: string) => void;
  handleAudioDeviceChange: (deviceId: string) => void;
}

const NO_VIDEO_DEVICES_MESSAGE = "No video input devices found.";

export { NO_VIDEO_DEVICES_MESSAGE };

function isDeviceNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const name = "name" in error ? String((error as { name?: string }).name) : "";
  return (
    name === "NotFoundError" ||
    /requested device not found/i.test(error.message) ||
    /device not found/i.test(error.message)
  );
}

export function useVideoRecorder({ onChange }: VideoRecorderProps): Readonly<VideoRecorderReturn> {
  const defaultFileType = "webm";
  const { uploadAsset } = useAssetUpload();
  const workflow = useNodes((state) => state.workflow);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInputDevices, setVideoInputDevices] = useState<VideoDevice[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<VideoDevice[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] =
    useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] =
    useState<string>("");
  const [isDeviceListVisible, setIsDeviceListVisible] =
    useState<boolean>(false);

  const fetchDevices = useCallback(() => {
    if (!navigator.mediaDevices) {
      setError("No media devices available");
      return;
    }
    console.info("Fetching video/audio devices");
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    // Prefer video-only for enumeration so a missing mic does not block camera use.
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (abortCtrl.signal.aborted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.getTracks().forEach((track) => track.stop());
        setError(null);
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((devices) => {
        if (!devices) {
          setError(NO_VIDEO_DEVICES_MESSAGE);
          return;
        }
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );

        const mappedVideoInputs = videoInputs.map((device, index) => {
          const normalizedDeviceId =
            device.deviceId === "default" ? "" : device.deviceId;
          const fallbackLabel =
            device.label ||
            (device.deviceId === "default"
              ? "System default camera"
              : `Camera ${index + 1}`);
          return {
            deviceId: normalizedDeviceId,
            label: fallbackLabel
          };
        });

        const mappedAudioInputs = audioInputs.map((device, index) => {
          const normalizedDeviceId =
            device.deviceId === "default" ? "" : device.deviceId;
          const fallbackLabel =
            device.label ||
            (device.deviceId === "default"
              ? "System default input"
              : `Microphone ${index + 1}`);
          return {
            deviceId: normalizedDeviceId,
            label: fallbackLabel
          };
        });

        const uniqueVideoInputs = mappedVideoInputs.filter(
          (device, index, self) =>
            index ===
            self.findIndex(
              (candidate) => candidate.deviceId === device.deviceId
            )
        );

        const uniqueAudioInputs = mappedAudioInputs.filter(
          (device, index, self) =>
            index ===
            self.findIndex(
              (candidate) => candidate.deviceId === device.deviceId
            )
        );

        setVideoInputDevices(uniqueVideoInputs);
        setAudioInputDevices(uniqueAudioInputs);

        setSelectedVideoDeviceId((currentSelection) => {
          if (
            uniqueVideoInputs.some(
              (device) => device.deviceId === currentSelection
            )
          ) {
            return currentSelection;
          }
          if (
            uniqueVideoInputs.some((device) => device.deviceId.length === 0)
          ) {
            return "";
          }
          return uniqueVideoInputs[0]?.deviceId ?? "";
        });

        setSelectedAudioDeviceId((currentSelection) => {
          if (
            uniqueAudioInputs.some(
              (device) => device.deviceId === currentSelection
            )
          ) {
            return currentSelection;
          }
          if (
            uniqueAudioInputs.some((device) => device.deviceId.length === 0)
          ) {
            return "";
          }
          return uniqueAudioInputs[0]?.deviceId ?? "";
        });

        if (videoInputs.length === 0) {
          setError(NO_VIDEO_DEVICES_MESSAGE);
        }
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") {
          console.info("Fetch aborted");
          return;
        }
        if (isDeviceNotFoundError(fetchError)) {
          setError(NO_VIDEO_DEVICES_MESSAGE);
          return;
        }
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to access camera";
        setError(message);
      });
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewing(false);
  }, []);

  const enableCamera = useCallback(() => {
    setIsCameraEnabled(true);
    setError(null);
    fetchDevices();
  }, [fetchDevices]);

  const disableCamera = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsCameraEnabled(false);
    setIsDeviceListVisible(false);
    setIsRecording(false);
    setError(null);
    setVideoInputDevices([]);
    setAudioInputDevices([]);
  }, [stopStream]);

  const startPreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedVideoDeviceId
          ? { deviceId: { exact: selectedVideoDeviceId } }
          : true,
        audio: selectedAudioDeviceId
          ? { deviceId: { exact: selectedAudioDeviceId } }
          : audioInputDevices.length > 0
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setIsPreviewing(true);
      setIsLoading(false);
    } catch (previewError) {
      if (isDeviceNotFoundError(previewError)) {
        setError(NO_VIDEO_DEVICES_MESSAGE);
      } else {
        const errorMessage =
          previewError instanceof Error
            ? previewError.message
            : "Failed to start preview";
        setError(errorMessage);
      }
      setIsLoading(false);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId, audioInputDevices.length]);

  const handleRecord = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!streamRef.current) {
      setError("No video stream available. Start preview first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    chunksRef.current = [];

    try {
      const preferredMimeType = `video/${defaultFileType}`;
      const actualMimeType = MediaRecorder.isTypeSupported(preferredMimeType)
        ? preferredMimeType
        : "video/webm";
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: actualMimeType
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fileExtension = actualMimeType.split("/")[1] || "webm";
        const blob = new Blob(chunksRef.current, {
          type: actualMimeType
        });
        const file = new File([blob], `recording.${fileExtension}`, {
          type: actualMimeType
        });

        uploadAsset({
          file,
          workflow_id: workflow.id,
          onCompleted: (asset: Asset) => {
            onChange(asset);
            stopStream();
          },
          onFailed: (uploadError) => setError(`Upload failed: ${uploadError}`)
        });

        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsLoading(false);
    } catch (recordError) {
      const errorMessage =
        recordError instanceof Error
          ? recordError.message
          : "Failed to start recording";
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [
    isRecording,
    defaultFileType,
    onChange,
    uploadAsset,
    workflow.id,
    stopStream
  ]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }
      stopStream();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [stopStream]);

  const toggleDeviceListVisibility = useCallback(() => {
    setIsDeviceListVisible((prevState) => !prevState);
    if (isCameraEnabled) {
      fetchDevices();
    }
  }, [fetchDevices, isCameraEnabled]);

  const handleVideoDeviceChange = useCallback((deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
  }, []);

  const handleAudioDeviceChange = useCallback((deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
  }, []);

  return {
    error,
    setError,
    videoRef,
    handleRecord,
    isRecording,
    isPreviewing,
    isLoading,
    isCameraEnabled,
    enableCamera,
    disableCamera,
    startPreview,
    stopStream,
    videoInputDevices,
    audioInputDevices,
    isDeviceListVisible,
    toggleDeviceListVisibility,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    handleVideoDeviceChange,
    handleAudioDeviceChange
  };
}
