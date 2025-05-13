// src/utils/request.ts
export async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, options);
  // parse JSON (or an empty object on parse‐fail)
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // bubble up whatever { error: "..." } the API gave you
    throw new Error((data as any).error || "Unknown API Error");
  }

  return data as T;
}
