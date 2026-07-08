import { AppBar as MUIAppBar, Toolbar, Typography } from "@mui/material";

export default function AppBar() {
  return (
    <MUIAppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Typography variant="h6" component="div">
          SV-Marker
        </Typography>
      </Toolbar>
    </MUIAppBar>
  );
}
