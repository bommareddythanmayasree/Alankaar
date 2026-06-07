const KEY = "erp_auth";
const LEGACY_KEY = "alankar_erp_auth_v1";

export type StoredAuth = {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: "ADMIN" | "WAREHOUSE_MANAGER" | "BRANCH_MANAGER";
    branchId?: string | null;
  };
};

function isValidAuth(value: unknown): value is StoredAuth {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.token !== "string") return false;
  if (!v.user || typeof v.user !== "object") return false;
  const u = v.user as Record<string, unknown>;
  if (typeof u.id !== "string") return false;
  if (!["ADMIN", "WAREHOUSE_MANAGER", "BRANCH_MANAGER"].includes(u.role as string)) return false;
  return true;
}

export function loadAuth(): StoredAuth | null {
  try {
    // Try primary key first
    let raw = localStorage.getItem(KEY);
    // Fall back to legacy key (migrate if found)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        localStorage.setItem(KEY, raw);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidAuth(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth | null) {
  if (!auth) {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(auth));
}

