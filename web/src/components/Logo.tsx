/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useEffect, useState, useCallback, memo } from "react";
import { DATA_TYPES } from "../config/data_types";
// === CUSTOM FORK START: AiStudio Branding ===
import { useTheme } from "@mui/material/styles";
// === CUSTOM FORK END ===
import type { Theme } from "@mui/material/styles";
import { MOTION, SPACING, getSpacingPx } from "./ui_primitives";
// === CUSTOM FORK START: AiStudio Branding ===
import { APP_DISPLAY_NAME, APP_ICON_SRC } from "../custom/branding";
// === CUSTOM FORK END ===

const randomDatatype = () => {
  return DATA_TYPES[Math.floor(Math.random() * DATA_TYPES.length)];
};

const logoStyles = (
  theme: Theme,
  bgColor: string,
  textColor: string,
  opacity: number,
  width: string,
  height: string,
  fontSize: string,
  borderRadius: string,
  small: boolean,
  invertLogo: boolean
) =>
  css({
    display: "flex",
    alignItems: "center",
    gap: getSpacingPx(SPACING.xxl),
    margin: `${getSpacingPx(SPACING.micro)} 0 0 0`,
    ".nt": {
      fontFamily: theme.fontFamily1,
      fontWeight: 600,
      color: "white",
      width: width,
      height: height,
      backgroundColor: "transparent",
      opacity: opacity,
      marginTop: getSpacingPx(SPACING.micro),
      transition: `opacity ${MOTION.slow} ${200}ms`
    },
    ".nodetool": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: width,
      height: height,
      textAlign: "center",
      userSelect: "none",
      fontSize: fontSize,
      lineHeight: "1em",
      padding: "0px",
      color: theme.vars?.palette?.grey?.[50] ?? "#000000",
      borderRadius: ".1em",
      cursor: "pointer",
      boxSizing: "border-box",
      transition: `all ${MOTION.slow}`
    },
    ".nt:hover .nodetool": {
      borderRadius: borderRadius,
      backgroundColor: bgColor,
      color: textColor,
      textShadow: small ? "0" : `0 0 2px ${textColor}`,
      filter: small ? "none" : "blur(0.3px)",
      boxShadow: small ? `0` : `0 0 11px ${bgColor}`
    },
    ".logo-image": {
      cursor: "pointer",
      // === CUSTOM FORK START: AiStudio Branding ===
      width: width,
      height: height,
      // === CUSTOM FORK END ===
      objectFit: "contain",
      filter: invertLogo ? "invert(1)" : undefined
    }
  });

type LogoProps = {
  width: string;
  height: string;
  fontSize: string;
  borderRadius: string;
  small: boolean;
  singleLine?: boolean;
  enableText?: boolean;
  onClick?: () => void;
};

const Logo = memo(function Logo({
  width,
  height,
  fontSize,
  borderRadius,
  small,
  singleLine,
  enableText = false,
  onClick
}: LogoProps) {
  const [rdt, setRdt] = useState(randomDatatype());
  const [hoverColor, setHoverColor] = useState(rdt.color);
  const [textColor, setTextColor] = useState(rdt.textColor);
  const [opacity, setOpacity] = useState(0);

  const handleMouseEnter = useCallback(() => {
    setRdt(randomDatatype());
    setHoverColor(rdt.color);
    setTextColor(rdt.textColor);
  }, [rdt]);

  useEffect(() => {
    setOpacity(1);
  }, []);

  const theme = useTheme();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      className="nodetool-logo"
      css={logoStyles(
        theme,
        hoverColor,
        textColor,
        opacity,
        width,
        height,
        fontSize,
        borderRadius,
        small,
        // === CUSTOM FORK START: AiStudio Branding ===
        // Color SVG mark — do not invert in light mode.
        false
        // === CUSTOM FORK END ===
      )}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {small && (
        // === CUSTOM FORK START: AiStudio Branding ===
        <img className="logo-image" src={APP_ICON_SRC} alt={APP_DISPLAY_NAME} />
        // === CUSTOM FORK END ===
      )}
      {enableText && (
        <div className="nt" onMouseEnter={handleMouseEnter} aria-hidden="true">
          <div className="nodetool" aria-hidden="true">
            {!singleLine && (
              <>
                {"NODE"}
                <br />
                {"TOOL"}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Logo;
