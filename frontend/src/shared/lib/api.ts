import { useAuth } from "../../app/auth/auth-context";

const API_BASE = "https://alankaar-backend-t308.onrender.com";

export type ApiError = { message: string };

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { message: text || res.statusText } as any as T;
  }
}

export function useApi() {
  const { auth } = useAuth();

  return {
    async get<T>(path: string): Promise<T> {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      });
      if (!res.ok) throw await parseJson<ApiError>(res);
      return parseJson<T>(res);
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await parseJson<ApiError>(res);
      return parseJson<T>(res);
    },
  };
}

