/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import type { Theme } from "@mui/material/styles";
import { useEffect, memo, useCallback, useMemo, useState, useRef, ChangeEvent } from "react";
import { Asset } from "../../stores/ApiTypes";
import { useFileDrop } from "../../hooks/handlers/useFileDrop";
import { Tooltip, ToolbarIconButton, Text, LoadingSpinner, MOTION, SPACING, BORDER_RADIUS, Z_INDEX, getSpacingPx } from "../ui_primitives";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ImageDimensions from "../node/ImageDimensions";
import { useTheme } from "@mui/material/styles";
import AssetViewer from "../assets/AssetViewer";
import WaveRecorder from "../audio/WaveRecorder";
import AudioPlayer from "../audio/AudioPlayer";
import VideoRecorder from "../video/VideoRecorder";
import { PropertyProps } from "../node/PropertyInput";
import isEqual from "../../utils/isEqual";
import { isElectron } from "../../utils/browser";
import { useAssetUpload } from "../../serverState/useAssetUpload";
import { CopyAssetButton } from "../common/CopyAssetButton";
import { alphaSurfaceBg } from "../../styles/AlphaSurface";
import { pathToFileUri } from "../../utils/localFile";
// === CUSTOM FORK START: dropzone-paste ===
import { useDropzonePasteTarget } from "../../custom/dropzone-paste";
// === CUSTOM FORK END ===

interface PropertyDropzoneProps {
  asset: Asset | undefined;
  uri: string | undefined;
  onChange: (value: {
    uri: string;
    type: string;
    asset_id?: string | null;
  }) => void;
  contentType: string;
  props: PropertyProps;
  showRecorder?: boolean;
}

const PropertyDropzone = ({
  asset,
  uri,
  props,
  onChange,
  contentType,
  showRecorder = true
}: PropertyDropzoneProps) => {
  const theme = useTheme();
  const mediaType = contentType.split("/")[0];

  const onChangeRecorderAsset = useCallback(
    (recorded: Asset) => {
      props.onChange({
        asset_id: recorded.id,
        uri: recorded.get_url,
        type: mediaType
      });
    },
    [mediaType, props.onChange]
  );

  const { onDrop, onDragOver, filename, uploading } = useFileDrop({
    uploadAsset: true,
    onChangeAsset: (uploaded: Asset) =>
      onChange({
        uri: uploaded.get_url || "",
        type: mediaType,
        asset_id: uploaded.id
      }),
    // Desktop: bind the real disk path. Preview streams via /api/files/local
    // (Electron backend sets NODETOOL_ELECTRON=1 so paths outside $HOME work).
    onChangeLocalFile: isElectron
      ? (localUri) =>
          onChange({
            uri: localUri,
            type: mediaType,
            asset_id: null
          })
      : undefined,
    type: mediaType as "image" | "audio" | "video" | "all"
  });

  // === CUSTOM FORK START: dropzone-paste ===
  const { pasteTargetId } = useDropzonePasteTarget({
    mediaType,
    applyAsset: (uploaded) =>
      onChange({
        uri: uploaded.get_url || "",
        type: mediaType,
        asset_id: uploaded.id
      })
  });
  // === CUSTOM FORK END ===

  const [openViewer, setOpenViewer] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = `audio-${props.property.name}-${props.propertyIndex}`;

  useEffect(() => {
    setPreviewError(null);
  }, [uri]);

  const styles = (theme: Theme) =>
    css({
      ".drop-container": {
        position: "relative",
        width: "100%",
        marginTop: `-${getSpacingPx(SPACING.xs)}`, // was -3px
        display: "flex",
        flexDirection: "column",
        alignItems: "normal",
        gap: "0"
      },
      ".dropzone": {
        position: "relative",
        minHeight: "30px",
        width: "100%",
        border: "0",
        maxWidth: "none",
        textAlign: "left",
        transition: MOTION.all,
        outline: `1px dashed ${theme.vars.palette.divider}`,
        margin: `${theme.spacing(SPACING.sm)} 0`,
        backgroundColor: theme.vars.palette.Paper.overlay,
        borderRadius: BORDER_RADIUS.md,

        "&:hover": {
          outline: `1px dashed ${theme.vars.palette.text.secondary}`,
          backgroundColor: theme.vars.palette.action.selected
        },
        "&.drag-over": {
          backgroundColor: theme.vars.palette.action.selected,
          outline: `2px dashed ${theme.vars.palette.primary.main}`,
          outlineOffset: "-2px"
        }
      },
      ".dropzone.dropped": {
        width: "100%",
        border: "0",
        maxWidth: "none",
        outline: `1px solid ${theme.vars.palette.divider}`,
        backgroundColor: "transparent",
        padding: getSpacingPx(SPACING.xs)
      },
      ".dropzone p": {
        textAlign: "left"
      },
      ".dropzone p.centered": {
        margin: "auto",
        textAlign: "left",
        padding: "1em",
        minWidth: "60px",
        minHeight: "14px",
        lineHeight: "1.1em",
        fontFamily: theme.fontFamily2,
        textTransform: "uppercase",
        letterSpacing: "1px",
        fontSize: "var(--fontSizeSmaller)",
        color: theme.vars.palette.grey[500]
      },
      ".dropzone .image-preview-surface": {
        ...alphaSurfaceBg,
        borderRadius: BORDER_RADIUS.sm,
        overflow: "hidden"
      },
      ".dropzone img": {
        width: "100%",
        height: "auto",
        maxHeight: "200px",
        objectFit: "contain",
        display: "block",
        borderRadius: BORDER_RADIUS.sm
      },
      ".prop-drop": {
        fontSize: theme.fontSizeSmaller,
        lineHeight: "1.1em"
      },
      ".image-dimensions": {
        opacity: 0,
        transition: `opacity ${MOTION.normal}`
      },
      "&:hover .image-dimensions": {
        opacity: 1
      },
      ".asset-actions": {
        position: "absolute",
        top: "4px",
        right: "4px",
        display: "flex",
        gap: getSpacingPx(SPACING.xs),
        opacity: 0,
        transition: `opacity ${MOTION.normal}`,
        zIndex: Z_INDEX.dropdown
      },
      ".dropzone:hover .asset-actions": {
        opacity: 1
      },
      // Touch devices have no hover; keep the asset actions reachable.
      "@media (pointer: coarse)": {
        ".asset-actions": { opacity: 1 }
      },
      ".asset-action-button": {
        backgroundColor: theme.vars.palette.c_scrim,
        color: theme.vars.palette.grey[100],
        padding: getSpacingPx(SPACING.xs),
        width: "28px",
        height: "28px",
        "&:hover": {
          backgroundColor: theme.vars.palette.primary.main,
          color: theme.vars.palette.common.white
        }
      }
    });

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      onDragOver(e);
      setIsDragOver(true);
    },
    [onDragOver]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      onDrop(e);
      setIsDragOver(false);
    },
    [onDrop]
  );

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    setOpenViewer(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setOpenViewer(false);
  }, []);

  const handleVolumeChange = useCallback((e: React.SyntheticEvent<HTMLAudioElement>) => {
    e.currentTarget.volume = 1;
  }, []);

  const { uploadAsset: uploadAssetFn } = useAssetUpload();

  const getAcceptAttribute = useCallback(() => {
    const type = contentType.split("/")[0];
    switch (type) {
      case "image":
        return "image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg";
      case "audio":
        return "audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac";
      case "video":
        return "video/*,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv";
      case "document":
        return ".pdf,.doc,.docx,.txt,.html";
      default:
        return "*/*";
    }
  }, [contentType]);

  const handleBrowserFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const file = files[0];
    uploadAssetFn({
      file,
      onCompleted: (uploaded) => {
        onChange({
          uri: uploaded.get_url || "",
          type: mediaType,
          asset_id: uploaded.id
        });
      },
      onFailed: (error) => {
        console.error("Failed to upload asset:", error);
      }
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [mediaType, onChange, uploadAssetFn]);

  const handleNativeFilePicker = useCallback(async () => {
    if (!window.api?.dialog?.openFile) {
      return;
    }

    try {
      const getFilters = () => {
        const type = contentType.split("/")[0];
        switch (type) {
          case "image":
            return [
              { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"] }
            ];
          case "audio":
            return [
              { name: "Audio", extensions: ["mp3", "wav", "ogg", "m4a", "flac", "aac"] }
            ];
          case "video":
            return [
              { name: "Video", extensions: ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"] }
            ];
          case "document":
            return [
              { name: "Documents", extensions: ["pdf", "doc", "docx", "txt", "html"] }
            ];
          default:
            return undefined;
        }
      };

      const result = await window.api.dialog.openFile({
        title: `Select ${contentType.split("/")[0]}`,
        filters: getFilters()
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        // Desktop: reference on disk — same path as drag-drop, previewed via
        // /api/files/local (NODETOOL_ELECTRON unlocks paths outside $HOME).
        onChange({
          uri: pathToFileUri(filePath),
          type: mediaType,
          asset_id: null
        });
      }
    } catch (error) {
      console.error("Error opening file picker:", error);
    }
  }, [contentType, mediaType, onChange]);

  const handleDropzoneClick = useCallback(() => {
    if (isElectron && window.api?.dialog?.openFile) {
      handleNativeFilePicker();
    } else {
      handleBrowserFilePicker();
    }
  }, [handleNativeFilePicker, handleBrowserFilePicker]);

  const handleReplaceClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleDropzoneClick();
  }, [handleDropzoneClick]);

  const renderViewer = useMemo(() => {
    switch (contentType.split("/")[0]) {
      case "image":
        return (
          <>
            <AssetViewer
              contentType={contentType + "/*"}
              url={uri}
              open={openViewer}
              onClose={handleCloseViewer}
            />
            <div className="image-preview-surface" style={{ position: "relative" }}>
              <img
                ref={imageRef}
                src={asset?.get_url || uri || ""}
                alt={asset?.name || ""}
                onLoad={handleImageLoad}
                onDoubleClick={handleDoubleClick}
                draggable={false}
              />
              {imageDimensions && (
                <ImageDimensions
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                />
              )}
            </div>
          </>
        );
      case "audio":
        return (
          <>
            {asset || uri ? (
              <div id={id} aria-labelledby={id} className="audio-drop">
                <AssetViewer
                  contentType={contentType + "/*"}
                  asset={asset ? asset : undefined}
                  url={uri ? uri : undefined}
                  open={openViewer}
                  onClose={handleCloseViewer}
                />
                <audio
                  style={{ width: "100%", height: "20px" }}
                  onVolumeChange={handleVolumeChange}
                  src={uri as string}
                  aria-label={filename || "Audio"}
                >
                  Your browser does not support the audio element.
                </audio>
                <p className="centered uppercase">{filename}</p>
                <AudioPlayer filename={filename} source={uri as string} />
              </div>
            ) : (
              <p className="centered uppercase">Drop audio</p>
            )}
          </>
        );
      case "video":
        return (
          <>
            {uri ? (
              <>
                <AssetViewer
                  contentType="video/*"
                  asset={asset ? asset : undefined}
                  url={uri ? uri : undefined}
                  open={openViewer}
                  onClose={handleCloseViewer}
                />
                <video
                  key={uri}
                  style={{ width: "100%", height: "auto" }}
                  controls
                  preload="metadata"
                  src={uri}
                  aria-label={filename || asset?.name || "Video"}
                  onLoadedData={() => setPreviewError(null)}
                  onError={() =>
                    setPreviewError(
                      "Could not load video preview. Try another file (H.264 MP4 works best)."
                    )
                  }
                >
                  Your browser does not support the video element.
                </video>
                {(filename || asset?.name) && (
                  <p className="centered uppercase">{filename || asset?.name}</p>
                )}
                {previewError && (
                  <Text
                    size="smaller"
                    sx={{ color: "var(--palette-error-main)", padding: "0.5em" }}
                  >
                    {previewError}
                  </Text>
                )}
              </>
            ) : (
              <p className="centered uppercase">Drop video</p>
            )}
          </>
        );
      case "document": {
        const fileExtension = uri?.toLowerCase().split(".").pop();

        if (fileExtension === "pdf") {
          return (
            <iframe
              src={uri}
              style={{ width: "100%", height: "400px", border: "none" }}
              allow="fullscreen; clipboard-write"
              title="PDF viewer"
            />
          );
        }

        if (fileExtension === "txt" || fileExtension === "html") {
          return (
            <iframe
              src={uri}
              // Asset bytes are user content served from the app's own origin.
              // An empty sandbox drops it into an opaque origin so a stored
              // .html document can't run script against the session, matching
              // every other HTML iframe in the app. The storage endpoint also
              // serves .html as text/plain; this is the second lock.
              sandbox=""
              style={{ width: "100%", height: "400px", border: "none" }}
              allow="fullscreen"
              title="Text viewer"
            />
          );
        }

        return <pre>{asset?.name}</pre>;
      }
      default:
        return null;
    }
  }, [contentType, uri, openViewer, asset, id, filename, handleImageLoad, handleDoubleClick, handleCloseViewer, imageDimensions, handleVolumeChange, previewError]);

  return (
    <div css={styles(theme)}>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={getAcceptAttribute()}
        onChange={handleFileInputChange}
      />

      <div className="drop-container">
        <div
          role={uri ? undefined : "button"}
          tabIndex={uri ? undefined : 0}
          className={`dropzone nodrag ${uri ? "dropped" : ""} ${isDragOver ? "drag-over" : ""
            }`}
          style={{
            borderWidth: uri === "" ? "1px" : "0px",
            cursor: uri ? "default" : "pointer"
          }}
          onClick={uri ? undefined : handleDropzoneClick}
          onKeyDown={uri ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleDropzoneClick(); } }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          // === CUSTOM FORK START: dropzone-paste ===
          data-dropzone-paste-id={pasteTargetId}
          // === CUSTOM FORK END ===
        >
          {uploading && (
            <Text
              size="smaller"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: getSpacingPx(SPACING.xs),
                padding: getSpacingPx(SPACING.sm),
                color: "var(--palette-grey-300)"
              }}
            >
              <LoadingSpinner size="small" />
              Uploading{filename ? ` ${filename}` : "…"}
            </Text>
          )}
          {!uploading && (uri || mediaType === "audio") ? (
            <>
              {renderViewer}
              {uri && (
                <div className="asset-actions">
                  <CopyAssetButton
                    contentType={contentType}
                    url={uri}
                    className="asset-action-button"
                    sx={{
                      backgroundColor: "var(--palette-c_scrim)",
                      width: "28px",
                      height: "28px",
                      "&:hover": {
                        backgroundColor: "var(--palette-c_scrim_strong)"
                      }
                    }}
                  />
                  <ToolbarIconButton
                    tooltip="Replace file"
                    icon={<FolderOpenIcon fontSize="small" />}
                    className="asset-action-button"
                    onClick={handleReplaceClick}
                    size="small"
                  />
                </div>
              )}
            </>
          ) : !uploading ? (
            <Tooltip title={mediaType === "image" ? "Click, drop, or paste an image" : "Click to select a file or drag and drop"}>
              <p className="prop-drop centered uppercase">Click or drop {contentType}</p>
            </Tooltip>
          ) : null}
        </div>
        {mediaType === "audio" && showRecorder && (
          <WaveRecorder onChange={onChangeRecorderAsset} />
        )}
        {mediaType === "video" && showRecorder && (
          <VideoRecorder onChange={onChangeRecorderAsset} />
        )}
      </div>
    </div>
  );
};

export default memo(PropertyDropzone, isEqual);
