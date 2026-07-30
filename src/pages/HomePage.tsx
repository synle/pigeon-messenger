import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { Link as RouterLink } from "react-router";
import { listConnections } from "../lib/api";
import type { Connection } from "../types/messaging";

/**
 * Inbox / home page.
 *
 * For now it just confirms the sidecar is reachable, shows the app
 * version, and lists every configured connection at a glance. A real
 * unified inbox will live here once an adapter actually returns chats.
 */
export default function HomePage() {
  const [version, setVersion] = useState<string>("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    invoke<string>("get_app_version")
      .then(setVersion)
      .catch(() => setVersion("(running outside Tauri)"));
    listConnections()
      .then(setConnections)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h4">Inbox</Typography>
        <Typography variant="caption" color="text.secondary">
          {version || "loading…"}
        </Typography>
      </Stack>

      {error && <Alert severity="warning">Sidecar error: {error}</Alert>}

      {connections.length === 0 ? (
        <Card>
          <CardContent>
            <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
              <Typography variant="h6">No connections yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Pigeon Messenger talks to many chat platforms at once. Add your first connection
                (Slack, Discord, Telegram, …) to get started.
              </Typography>
              <Button component={RouterLink} to="/connections/new" variant="contained">
                Add a connection
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {connections.map((c) => (
            <Card key={c.id}>
              <CardContent>
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography variant="h6">{c.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.platform}
                    </Typography>
                  </Box>
                  <Chip
                    label={c.status}
                    color={c.status === "connected" ? "success" : "default"}
                    size="small"
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
