import { useRef, useState, type ReactNode } from "react";
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import { ArrowDropDown as ArrowDropDownIcon } from "@mui/icons-material";

type SplitButtonsProps = {
  options: {
    key: string;
    label: string;
    startIcon?: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    loadingPosition?: "start" | "end";
    onClick: () => void;
  }[];
};

export default function SplitButtons({ options }: SplitButtonsProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <ButtonGroup variant="outlined" ref={anchorRef}>
        <Button
          startIcon={options[selectedIndex].startIcon}
          disabled={options[selectedIndex].disabled}
          loading={options[selectedIndex].loading}
          loadingPosition={options[selectedIndex].loadingPosition}
          onClick={options[selectedIndex].onClick}
        >
          {options[selectedIndex].label}
        </Button>
        <Button size="small" onClick={() => setIsMenuOpen(true)}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 1 }}
        open={isMenuOpen}
        // eslint-disable-next-line react-hooks/refs
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener
                onClickAway={(e) => {
                  if (anchorRef.current?.contains(e.target as HTMLElement)) {
                    return;
                  }

                  setIsMenuOpen(false);
                }}
              >
                <MenuList autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.key}
                      selected={selectedIndex === index}
                      onClick={() => {
                        setSelectedIndex(index);
                        setIsMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
