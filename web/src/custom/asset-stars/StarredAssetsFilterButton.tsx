import { memo } from "react";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Tooltip } from "../../components/ui_primitives";
import { EditorButton } from "../../components/editor_ui";
import { TOOLTIP_ENTER_DELAY } from "../../config/constants";
import {
  useFavoriteAssetsStore,
  useStarredAssetFilter
} from "./FavoriteAssetsStore";

const StarredAssetsFilterButton: React.FC = () => {
  const starredFilter = useStarredAssetFilter();
  const toggleStarredFilter = useFavoriteAssetsStore(
    (state) => state.toggleStarredFilter
  );
  const label = starredFilter ? "Show all assets" : "Show starred only";

  return (
    <Tooltip delay={TOOLTIP_ENTER_DELAY} title={label} disableInteractive>
      <EditorButton
        onClick={toggleStarredFilter}
        tabIndex={-1}
        aria-pressed={starredFilter}
        aria-label={label}
        className={starredFilter ? "starred-filter-active" : undefined}
      >
        {starredFilter ? <StarIcon /> : <StarBorderIcon />}
      </EditorButton>
    </Tooltip>
  );
};

export default memo(StarredAssetsFilterButton);
