/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import type { Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TutorialCard } from "../tutorials/TutorialCard";
import { TUTORIALS } from "../tutorials/tutorialsData";
import { SPACING, getSpacingPx } from "../ui_primitives";
import { wrapStyles, SectionHeader, SectionLink } from "./dashboardChrome";
// === CUSTOM FORK START: AiStudio Branding ===
import { APP_DISPLAY_NAME } from "../../custom/branding";
// === CUSTOM FORK END ===
// === CUSTOM FORK START: Product Profile ===
import { visibleTutorials } from "../../custom/product-profile";
// === CUSTOM FORK END ===

const gridStyles = (theme: Theme) =>
  css({
    paddingTop: getSpacingPx(SPACING.md),
    ".tut-grid": {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: getSpacingPx(SPACING.md),
      [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "repeat(2, 1fr)"
      },
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr"
      }
    }
  });

/** Dashboard section: the beginner tutorials, opening the Tutorials page. */
const DashboardTutorials: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const open = useCallback(
    (id: string) => navigate(`/tutorials?id=${id}`),
    [navigate]
  );

  return (
    <section css={gridStyles(theme)}>
      <div css={wrapStyles(theme)}>
        <SectionHeader title="Learn the basics" count={`new to ${APP_DISPLAY_NAME}? start here`}>
          <SectionLink onClick={() => navigate("/tutorials")}>
            All tutorials
          </SectionLink>
        </SectionHeader>
        <div className="tut-grid">
          {visibleTutorials(TUTORIALS).map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} onClick={open} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(DashboardTutorials);
