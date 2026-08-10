/** @jsxImportSource @emotion/react */
import React, { useCallback, useRef, useState, memo, forwardRef } from "react";
import { css } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { CONTROL, MOTION } from "./tokens";
import { IconButton, Tooltip, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { TOOLTIP_ENTER_DELAY } from "../../config/constants";
import { useAutoFocusEnabled } from "../../hooks/useAutoFocusEnabled";
import { isEditableElement } from "../../utils/browser";

export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Accessible name. Defaults to the placeholder, which is the only visible
   * hint these fields carry — without it the input is announced unnamed. */
  ariaLabel?: string;
  /** Whether to show clear button */
  showClear?: boolean;
  /** Size variant */
  size?: "small" | "medium";
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Auto-focus on mount. Ignored on touch devices, where it would raise the
   * virtual keyboard over the panel that just opened. */
  autoFocus?: boolean;
  /**
   * When true, alphanumeric keys focus this field and start the query — same
   * behavior as Model Manager search. Skipped while another editable is focused.
   */
  focusOnTyping?: boolean;
  /** Debounce delay in ms (0 = no debounce) */
  debounceMs?: number;
  /** Callback when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Additional className */
  className?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Tooltip for clear button */
  clearTooltip?: string;
  /** Tooltip placement */
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  /** Additional sx applied to the underlying TextField root. */
  sx?: SxProps<Theme>;
}

const styles = (theme: Theme) => css`
  .search-input {
    .MuiInputBase-root {
      border-radius: ${CONTROL.radius};
      background-color: ${theme.vars.palette.Paper.overlay};
      transition: ${MOTION.all};
      min-height: ${CONTROL.height.lg}px;

      &.MuiInputBase-sizeSmall {
        min-height: ${CONTROL.height.sm}px;
      }

      &:hover {
        background-color: ${theme.vars.palette.action.selected};
      }

      &.Mui-focused {
        background-color: ${theme.vars.palette.action.selected};
        box-shadow: 0 0 0 2px ${theme.vars.palette.primary.main}40;
      }
    }

    /* MUI's outlined vertical padding targets ~56px / 40px fields; shrink it
       so the control lands on the CONTROL token heights (36 / 28). */
    .MuiOutlinedInput-input {
      padding-top: 7px;
      padding-bottom: 7px;
    }
    .MuiInputBase-sizeSmall .MuiOutlinedInput-input {
      padding-top: 3px;
      padding-bottom: 3px;
    }

    /* Shared form-control sizing: value at the 15px body token, placeholder
       softened to read as a muted hint rather than entered text. */
    .MuiInputBase-input {
      font-size: var(--fontSizeNormal);
    }
    .MuiInputBase-input::placeholder {
      opacity: 0.6;
    }
    
    .MuiOutlinedInput-notchedOutline {
      border-color: ${theme.vars.palette.divider};
      transition: ${MOTION.border};
    }
    
    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: ${theme.vars.palette.text.disabled};
    }
    
    .Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${theme.vars.palette.primary.main};
    }
  }
  
  .search-icon {
    color: ${theme.vars.palette.text.disabled};
  }
  
  .clear-button {
    padding: 4px;
    color: ${theme.vars.palette.text.disabled};
    transition: color ${MOTION.normal};
    
    &:hover {
      color: ${theme.vars.palette.text.primary};
      background-color: transparent;
    }
    
    &.disabled {
      visibility: hidden;
    }
  }
`;

export const SearchInput = memo(forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel,
  showClear = true,
  size = "small",
  disabled = false,
  autoFocus = false,
  focusOnTyping = false,
  debounceMs = 0,
  onSubmit,
  onClear,
  className,
  fullWidth = false,
  clearTooltip = "Clear search",
  tooltipPlacement = "top",
  sx
}, ref) => {
  const theme = useTheme();
  const autoFocusEnabled = useAutoFocusEnabled();
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setInputRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // Clicking the search icon / padding must still focus the field — otherwise
  // canvas single-key shortcuts eat the next keystrokes and "nothing is typed".
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const commitValue = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      if (debounceMs > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      } else {
        onChange(newValue);
      }
    },
    [onChange, debounceMs]
  );
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    commitValue(e.target.value);
  }, [commitValue]);
  
  const handleClear = useCallback(() => {
    // Drop the pending debounced change, or it fires after the clear and puts
    // the query the user just wiped back into the parent.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setLocalValue("");
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit(localValue);
    }
    if (e.key === "Escape" && localValue) {
      // Escape clears the query first; a second Escape reaches the menu or
      // dialog around us and closes it. One key press must not do both.
      e.stopPropagation();
      handleClear();
    }
  }, [localValue, onSubmit, handleClear]);
  
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Match Model Manager: type anywhere on the page to start searching, unless
  // focus is already in another editable control (API key fields, etc.).
  React.useEffect(() => {
    if (!focusOnTyping || disabled) {
      return;
    }
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (document.activeElement === inputRef.current) {
        return;
      }
      // Inactive workspace tabs stay mounted; never steal keys from there.
      if (inputRef.current?.closest("[inert]") != null) {
        return;
      }
      const eventTarget =
        event.target instanceof Element ? event.target : null;
      if (
        isEditableElement(document.activeElement) ||
        isEditableElement(eventTarget)
      ) {
        return;
      }
      if (event.key.length !== 1 || !/[a-zA-Z0-9]/.test(event.key)) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
      commitValue(event.key);
    };
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [focusOnTyping, disabled, commitValue]);
  
  return (
    <div
      className={`search-input-wrapper nodrag ${className || ""}`}
      css={styles(theme)}
      onMouseDown={(e) => {
        // Don't steal focus from the clear button's own mousedown handler.
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        focusInput();
      }}
    >
      <TextField
        className="search-input"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        autoFocus={autoFocus && autoFocusEnabled}
        fullWidth={fullWidth}
        sx={sx}
        inputRef={setInputRefs}
        slotProps={{
          htmlInput: { "aria-label": ariaLabel ?? placeholder },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className="search-icon" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: showClear && localValue ? (
              <InputAdornment position="end">
                <Tooltip 
                  title={clearTooltip} 
                  enterDelay={TOOLTIP_ENTER_DELAY}
                  placement={tooltipPlacement}
                >
                  <IconButton
                    className="clear-button"
                    aria-label={clearTooltip}
                    onClick={handleClear}
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : null
          }
        }}
      />
    </div>
  );
}));

SearchInput.displayName = "SearchInput";

export default SearchInput;
