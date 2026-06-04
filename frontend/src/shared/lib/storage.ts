const KEY = "alankar_erp_auth_v1";

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

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth | null) {
  if (!auth) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(auth));
}

