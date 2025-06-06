import { create } from "zustand";

interface AuthState {
  token: string | null;
  tenantId: string | null;
  setAuth: (token: string, tenantId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  tenantId: localStorage.getItem("tenantId"),
  setAuth: (token, tenantId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("tenantId", tenantId);
    set({ token, tenantId });
  },
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    set({ token: null, tenantId: null });
  },
}));
