/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { memo } from "react";
import type { Workflow } from "../../stores/ApiTypes";
import { MOTION } from "../../components/ui_primitives";
import { ExampleKindIcon } from "./icons";
import {
  THUMBNAIL_COLORS,
  exampleThumbnailKind
} from "./thumbnailKind";

const styles = css({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#000",
  ".example-thumb-tile": {
    width: "21%",
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "28%",
    fontSize: "1.35rem",
    transition: MOTION.transform,
    svg: {
      width: "58%",
      height: "58%",
      display: "block"
    }
  }
});

export interface ExampleThumbnailProps {
  workflow: Pick<Workflow, "tags" | "name">;
}

const ExampleThumbnail = memo(function ExampleThumbnail({
  workflow
}: ExampleThumbnailProps) {
  const kind = exampleThumbnailKind(workflow);
  const color = THUMBNAIL_COLORS[kind];
  return (
    <div
      css={styles}
      data-testid="example-thumbnail"
      data-kind={kind}
    >
      <div
        className="example-thumb-tile"
        style={{
          color,
          backgroundColor: `${color}24`
        }}
      >
        <ExampleKindIcon kind={kind} />
      </div>
    </div>
  );
});

export default ExampleThumbnail;
