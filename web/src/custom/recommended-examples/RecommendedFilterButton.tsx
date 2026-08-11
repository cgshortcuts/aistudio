import { memo } from "react";
import { RECOMMENDED_CATEGORY } from "./isRecommended";

export interface RecommendedFilterButtonProps {
  active: boolean;
  onClick: () => void;
}

const RecommendedFilterButton = memo(function RecommendedFilterButton({
  active,
  onClick
}: RecommendedFilterButtonProps) {
  return (
    <button
      type="button"
      className={`cat${active ? " on" : ""}`}
      aria-pressed={active}
      onClick={onClick}
      style={
        active
          ? {
              background: `${RECOMMENDED_CATEGORY.color}24`,
              borderColor: `${RECOMMENDED_CATEGORY.color}73`,
              color: RECOMMENDED_CATEGORY.color
            }
          : undefined
      }
    >
      <span
        className="cat-dot"
        style={{ background: RECOMMENDED_CATEGORY.color }}
      />
      {RECOMMENDED_CATEGORY.label}
    </button>
  );
});

export default RecommendedFilterButton;
