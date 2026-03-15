const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getPosts(token, { isRead, isDismissed } = {}) {
  const params = new URLSearchParams();
  if (isRead !== undefined) params.set("is_read", isRead);
  if (isDismissed !== undefined) params.set("is_dismissed", isDismissed);

  const res = await fetch(`${API_URL}/posts?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function updatePost(token, id, fields) {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
