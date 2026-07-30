import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { Link as RouterLink } from "react-router";
import { deleteConnection, listConnections, startConnection, stopConnection } from "../lib/api";
import type { Connection } from "../types/messaging";

/**
 * Connections management page. Lists every persisted connection with
 * start/stop/delete controls. Wraps the sidecar's `/api/connections`
 * endpoints — no platform-specific logic lives here.
 */
export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      setConnections(await listConnections());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleStart = async (id: string) => {
    try {
      await startConnection(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await stopConnection(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConnection(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h4">Connections</Typography>
        <Button component={RouterLink} to="/connections/new" variant="contained">
          Add connection
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {connections.length === 0 && !error ? (
        <Typography variant="body2" color="text.secondary">
          No connections configured yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {connections.map((c) => (
            <Card key={c.id}>
              <CardContent>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                      {c.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.platform} · created {new Date(c.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={c.status}
                    color={c.status === "connected" ? "success" : "default"}
                    size="small"
                  />
                  {c.status === "connected" ? (
                    <IconButton
                      aria-label={`Stop ${c.displayName}`}
                      onClick={() => handleStop(c.id)}
                    >
                      <StopIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      aria-label={`Start ${c.displayName}`}
                      onClick={() => handleStart(c.id)}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label={`Delete ${c.displayName}`}
                    onClick={() => handleDelete(c.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
