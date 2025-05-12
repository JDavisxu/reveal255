// src/utils/request.ts

export async function request(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const res = await fetch(url, options);
  
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Unknown API Error");
    }
  
    return res;
  }
  