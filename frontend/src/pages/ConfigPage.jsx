import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ConfigPage({ session }) {
  const [subreddits, setSubreddits] = useState([]);
  const [signals, setSignals] = useState([]);
  const [subInput, setSubInput] = useState("");
  const [signalInput, setSignalInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const token = session.access_token;

  useEffect(() => {
    fetch(`${API_URL}/config`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSubreddits(data.subreddits || []);
        setSignals(data.intent_signals || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  function addSubreddit() {
    const val = subInput.trim().replace(/^r\//, "");
    if (val && !subreddits.includes(val)) {
      setSubreddits([...subreddits, val]);
    }
    setSubInput("");
  }

  function addSignal() {
    const val = signalInput.trim();
    if (val && !signals.includes(val)) {
      setSignals([...signals, val]);
    }
    setSignalInput("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch(`${API_URL}/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subreddits, intent_signals: signals }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(`Failed to save (${res.status})`);
    } else {
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Configuration
        </Typography>
        <Button size="small" color="inherit" onClick={() => navigate("/")}>
          Back to dashboard
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Saved.</Alert>}

      {/* Subreddits */}
      <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
        Subreddits
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Which subreddits should be monitored?
      </Typography>
      <Box display="flex" gap={1} mb={1}>
        <TextField
          size="small"
          placeholder="e.g. startups"
          value={subInput}
          onChange={(e) => setSubInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubreddit())}
        />
        <Button variant="outlined" onClick={addSubreddit}>
          Add
        </Button>
      </Box>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={4}>
        {subreddits.map((s) => (
          <Chip
            key={s}
            label={`r/${s}`}
            onDelete={() => setSubreddits(subreddits.filter((x) => x !== s))}
          />
        ))}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Intent signals */}
      <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
        Intent signals
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        What phrases or pain points should trigger a flag?
      </Typography>
      <Box display="flex" gap={1} mb={1}>
        <TextField
          size="small"
          placeholder="e.g. looking for a CRM"
          value={signalInput}
          onChange={(e) => setSignalInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSignal())}
          sx={{ minWidth: 280 }}
        />
        <Button variant="outlined" onClick={addSignal}>
          Add
        </Button>
      </Box>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={4}>
        {signals.map((s) => (
          <Chip
            key={s}
            label={s}
            onDelete={() => setSignals(signals.filter((x) => x !== s))}
          />
        ))}
      </Stack>

      <Button variant="contained" onClick={handleSave} disabled={saving}>
        {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
      </Button>
    </Container>
  );
}
