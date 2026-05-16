import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router";

/** Top app bar with Inbox / Connections / Settings nav. */
export default function NavBar() {
  const { pathname } = useLocation();
  const isActive = (prefix: string) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Pigeon Messenger
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            variant={isActive("/") ? "outlined" : "text"}
          >
            Inbox
          </Button>
          <Button
            component={RouterLink}
            to="/connections"
            color="inherit"
            variant={isActive("/connections") ? "outlined" : "text"}
          >
            Connections
          </Button>
          <Button
            component={RouterLink}
            to="/settings"
            color="inherit"
            variant={isActive("/settings") ? "outlined" : "text"}
          >
            Settings
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
