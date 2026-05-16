import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import { createConnection, listPlatforms } from "../lib/api";
import type { Platform, PlatformInfo } from "../types/messaging";

/**
 * Form to add a new platform connection.
 *
 * Pulls the catalog from `/api/connections/platforms` so the list of
 * supported platforms (and the required config keys per platform)
 * stays defined on the sidecar side — adding a new platform there
 * automatically surfaces a row here.
 */
export default function AddConnectionPage() {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [platform, setPlatform] = useState<Platform | "">("");
  const [displayName, setDisplayName] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listPlatforms()
      .then(setPlatforms)
      .catch((e: Error) => setError(e.message));
  }, []);

  const selected = platforms.find((p) => p.platform === platform);

  const handlePlatformChange = (value: string) => {
    setPlatform(value as Platform);
    setConfig({}); // reset config fields when switching platforms
  };

  const handleSubmit = async () => {
    if (!platform) return;
    setSubmitting(true);
    setError("");
    try {
      await createConnection({ platform, displayName, config });
      navigate("/connections");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Typography variant="h4">Add connection</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              select
              label="Platform"
              value={platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              fullWidth
            >
              {platforms.map((p) => (
                <MenuItem key={p.platform} value={p.platform}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{p.displayName}</span>
                    <Chip
                      label={p.status}
                      size="small"
                      color={p.status === "ready" ? "success" : "default"}
                    />
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            {selected && (
              <Typography variant="body2" color="text.secondary">
                {selected.description}
              </Typography>
            )}

            <TextField
              label="Display name"
              placeholder="e.g. Work Slack"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
            />

            {selected?.requiredConfig.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                type={field.secret ? "password" : "text"}
                value={config[field.key] ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, [field.key]: e.target.value }))
                }
                fullWidth
              />
            ))}

            <Box>
              <Button
                variant="contained"
                disabled={!platform || !displayName || submitting}
                onClick={handleSubmit}
              >
                Create connection
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
