/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

import React, { memo, useEffect, useRef, useCallback } from "react";
import { Asset } from "../../stores/ApiTypes";
import { Box } from "../ui_primitives";
// === CUSTOM FORK START: asset-viewer-lightbox ===
import { registerMediaPlayToggle } from "../../custom/asset-viewer-lightbox";
// === CUSTOM FORK END ===

interface VideoViewerProps {
  asset?: Asset;
  url?: string;
}

const styles = () =>
  css({
    "&": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "80%",
      marginTop: "4em"
    },
    video: {
      margin: 0,
      width: "60%",
      height: "auto",
      maxHeight: "90%",
      top: 0,
      display: "block"
    }
  });

const VideoViewer: React.FC<VideoViewerProps> = memo(function VideoViewer({ asset, url }) {
  // === CUSTOM FORK START: asset-viewer-lightbox ===
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      void video.play().catch(() => {
        // Autoplay / user-gesture restrictions — ignore.
      });
    } else {
      video.pause();
    }
  }, []);

  useEffect(() => {
    registerMediaPlayToggle(togglePlay);
    return () => registerMediaPlayToggle(null);
  }, [togglePlay]);
  // === CUSTOM FORK END ===

  return (
    <Box className="video-viewer" css={styles()}>
      {/* === CUSTOM FORK START: asset-viewer-lightbox === */}
      <video ref={videoRef} controls={true} src={asset?.get_url || url || ""}>
        Your browser does not support the video element.
      </video>
      {/* Filename under the video removed for lightbox clarity. */}
      {/* === CUSTOM FORK END === */}
    </Box>
  );
});

export default VideoViewer;
