const BASE_URL = import.meta.env.VITE_API_URL ?? "";
async function request<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers: { "Content-Type": "application/json" }, ...options });
    if (!res.ok) { const body = await res.json().catch(() => ({})); return { data: null, error: (body as any).message ?? `Error ${res.status}` }; }
    return { data: await res.json() as T, error: null };
  } catch (err) { return { data: null, error: err instanceof Error ? err.message : "Network error" }; }
}
export const api = {
  get:    <T>(url: string, opts?: RequestInit) => request<T>(url, { method: "GET", ...opts }),
  post:   <T>(url: string, body: unknown, opts?: RequestInit) => request<T>(url, { method: "POST",   body: JSON.stringify(body), ...opts }),
  put:    <T>(url: string, body: unknown, opts?: RequestInit) => request<T>(url, { method: "PUT",    body: JSON.stringify(body), ...opts }),
  delete: <T>(url: string, opts?: RequestInit) => request<T>(url, { method: "DELETE", ...opts }),
};
