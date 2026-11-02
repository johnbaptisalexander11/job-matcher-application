async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getHealth = () => request("/api/health");

export function extractPdf(file) {
  const form = new FormData();
  form.append("cv", file);
  return request("/api/extract", { method: "POST", body: form });
}

export const analyze = (cvText, jobText, mode) =>
  request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cvText, jobText, mode }),
  });

export const getHistory = () => request("/api/history");
export const getHistoryItem = (id) => request(`/api/history/${encodeURIComponent(id)}`);
