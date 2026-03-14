import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
} from "@mui/material";

export default function PostCard({ post, onUpdate }) {
  const [loading, setLoading] = useState(false);

  async function update(fields) {
    setLoading(true);
    await onUpdate(post.id, fields);
    setLoading(false);
  }

  return (
    <Card variant="outlined" sx={{ mb: 2, opacity: post.is_dismissed ? 0.5 : 1 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {post.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          r/{post.subreddit} · {new Date(post.flagged_at).toLocaleDateString()}
        </Typography>
        {post.matched_signals?.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {post.matched_signals.map((signal) => (
              <Chip key={signal} label={signal} size="small" color="primary" variant="outlined" />
            ))}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ pt: 0 }}>
        <Button size="small" href={post.url} target="_blank" rel="noopener noreferrer">
          Open Thread
        </Button>
        {!post.is_read && (
          <Button size="small" onClick={() => update({ is_read: true })} disabled={loading}>
            Mark read
          </Button>
        )}
        {!post.is_dismissed && (
          <Button
            size="small"
            color="inherit"
            onClick={() => update({ is_dismissed: true })}
            disabled={loading}
          >
            Dismiss
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
