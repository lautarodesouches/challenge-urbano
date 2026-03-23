import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  logs: Array<{ id: string; type: string; message: string; payload: any; timestamp: string }>;
  addLog: (log: { type: string; message: string; payload: any; timestamp: string }) => void;
  clearLogs: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null, logs: [] }),
      logs: [],
      addLog: (log) =>
        set((state) => ({
          logs: [{ id: crypto.randomUUID(), ...log }, ...state.logs].slice(0, 50),
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'urbano-auth-storage',
      partialize: (state) => ({ token: state.token }), // Solo persistir el token
    }
  )
);
