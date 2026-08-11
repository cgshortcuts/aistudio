import { Asset } from "../../stores/ApiTypes";
import { DragEventHandler, useCallback, DragEvent, useState } from "react";
import { useNotificationStore } from "../../stores/NotificationStore";
import { useAssetUpload } from "../../serverState/useAssetUpload";
import {
  deserializeDragData,
  hasExternalFiles,
  extractFiles
} from "../../lib/dragdrop";
import { getLocalFilePath, pathToFileUri } from "../../utils/localFile";
import { contentTypeToNodeType } from "../../utils/NodeTypeMapping";
import { withMimeType } from "../../utils/mimeFromFilename";

type FileDropProps = {
  /** The type of files to accept: image, audio, video, document, or all */
  type: "image" | "audio" | "video" | "document" | "all";
  /** Whether to upload dropped files as assets to the server */
  uploadAsset?: boolean;
  /** Callback fired when a file is dropped and processed (returns URI) */
  onChange?: (uri: string) => void;
  /** Callback fired when a file is dropped and uploaded as an asset (returns Asset) */
  onChangeAsset?: (asset: Asset) => void;
  /**
   * Electron only: when the dropped file has a real disk path, call this with a
   * `file://` URI instead of uploading. Preview resolves via `/api/files/local`.
   */
  onChangeLocalFile?: (uri: string, file: File) => void;
};

type FileDropResult = {
  /** Handler to attach to dragOver events (required to enable dropping) */
  onDragOver: DragEventHandler<HTMLDivElement>;
  /** Handler to attach to drop events */
  onDrop: DragEventHandler<HTMLDivElement>;
  /** Name of the currently uploading file */
  filename: string;
  /** Whether an upload is in progress */
  uploading: boolean;
};

function fileMatchesDropType(
  file: File,
  type: FileDropProps["type"]
): boolean {
  if (type === "all") {
    return true;
  }

  const isDocument =
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (type === "document" && isDocument) {
    return true;
  }

  if (file.type.startsWith(`${type}/`)) {
    return true;
  }

  // Windows often leaves File.type empty; fall back to filename extension.
  return contentTypeToNodeType(file.type, file.name) === type;
}

export function useFileDrop(props: FileDropProps): FileDropResult {
  const [filename, setFilename] = useState("");
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { uploadAsset, isUploading } = useAssetUpload();
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const dragData = deserializeDragData(event.dataTransfer);

      if (dragData?.type === "asset") {
        const asset = dragData.payload as Asset;
        const assetType = asset.content_type.split("/")[0];
        if (
          props.type === "all" ||
          assetType === props.type ||
          (props.type === "document" &&
            (assetType === "application" || assetType === "text"))
        ) {
          props.onChangeAsset?.(asset);
          props.onChange?.(asset.get_url as string);
        } else {
          addNotification({
            type: "error",
            alert: true,
            content: `Invalid file type. Please drop a ${props.type} file.`
          });
        }
        return;
      }

      // Handle text data transfer
      if (event.dataTransfer.items && !event.dataTransfer.files.length) {
        const items = event.dataTransfer.items;
        if (items && items.length > 0) {
          Array.from(items).forEach((item) => {
            if (item.kind === "string") {
              item.getAsString((s) => {
                props.onChange?.(s);
              });
            }
          });
        }
        return;
      }

      // Handle external file drops
      if (hasExternalFiles(event.dataTransfer)) {
        const files = extractFiles(event.dataTransfer);
        const file = files[0];
        if (file) {
          if (!fileMatchesDropType(file, props.type)) {
            addNotification({
              type: "error",
              alert: true,
              content: `Invalid file type. Please drop a ${props.type} file.`
            });
            return;
          }

          setFilename(file.name);

          const localPath = getLocalFilePath(file);
          if (localPath && props.onChangeLocalFile) {
            props.onChangeLocalFile(pathToFileUri(localPath), file);
            return;
          }

          if (props.uploadAsset) {
            const fileToUpload = withMimeType(file);
            uploadAsset({
              file: fileToUpload,
              source:
                fileToUpload.type.startsWith("image/") || props.type === "image"
                  ? "drop"
                  : "file",
              onCompleted: (asset) => {
                if (props.onChangeAsset) {
                  props.onChangeAsset(asset);
                }
              },
              onFailed: (error) => {
                addNotification({
                  type: "error",
                  alert: true,
                  content: error
                });
              }
            });
          } else {
            const reader = new FileReader();
            reader.onload = function (loadEvent) {
              if (
                loadEvent.target?.result &&
                typeof loadEvent.target.result === "string" &&
                props.onChange
              ) {
                props.onChange(loadEvent.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    },
    [props, uploadAsset, addNotification]
  );

  return { onDragOver, onDrop, filename, uploading: isUploading };
}
