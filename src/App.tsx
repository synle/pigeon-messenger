import { Routes, Route, Navigate } from "react-router";
import { Box } from "@mui/material";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import ConnectionsPage from "./pages/ConnectionsPage";
import AddConnectionPage from "./pages/AddConnectionPage";
import SettingsPage from "./pages/SettingsPage";

/** Root component — top nav bar plus route outlet for the messenger pages. */
export default function App() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <NavBar />
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/connections/new" element={<AddConnectionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
