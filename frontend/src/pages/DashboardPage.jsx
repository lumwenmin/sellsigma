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
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getPosts, updatePost } from "../services/posts";
import PostCard from "../components/PostCard";

export default function DashboardPage({ session }) {
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState(0); // 0=All, 1=Unread, 2=Dismissed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = session.access_token;
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters =
        tab === 1 ? { isRead: false } :
        tab === 2 ? { isDismissed: true } :
        {};
      setPosts(await getPosts(token, filters));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [tab, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleUpdate(id, fields) {
    try {
      await updatePost(token, id, fields);
      fetchPosts();
    } catch (e) {
      setError(e.message);
    }
  }

  const visiblePosts = tab === 2 ? posts : posts.filter((p) => !p.is_dismissed);

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          SellSigma
        </Typography>
        <Box display="flex" gap={1}>
          <Button size="small" color="inherit" onClick={() => navigate("/config")}>
            Settings
          </Button>
          <Button size="small" color="inherit" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </Box>
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
