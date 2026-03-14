import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import PostCard from "../components/PostCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function DashboardPage({ session }) {
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState(0); // 0=All, 1=Unread, 2=Dismissed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = session.access_token;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (tab === 1) params.set("is_read", "false");
    if (tab === 2) params.set("is_dismissed", "true");
    try {
      const res = await fetch(`${API_URL}/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      setPosts(await res.json());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [tab, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleUpdate(id, fields) {
    await fetch(`${API_URL}/posts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });
    fetchPosts();
  }

  // On All/Unread tabs, hide dismissed posts
  const visiblePosts = tab === 2 ? posts : posts.filter((p) => !p.is_dismissed);

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          SellSigma
        </Typography>
        <Button size="small" color="inherit" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="All" />
        <Tab label="Unread" />
        <Tab label="Dismissed" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : visiblePosts.length === 0 ? (
        <Typography color="text.secondary">No posts here.</Typography>
      ) : (
        visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={handleUpdate} />
        ))
      )}
    </Container>
  );
}
