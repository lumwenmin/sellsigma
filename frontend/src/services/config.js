const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getConfig(token) {
  const res = await fetch(`${API_URL}/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function saveConfig(token, { subreddits, intent_signals }) {
  const res = await fetch(`${API_URL}/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subreddits, intent_signals }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
