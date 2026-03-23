import { create } from 'zustand';

interface AppState {
  logs: Array<{ id: string; type: string; message: string; payload: any; timestamp: string }>;
  addLog: (log: { type: string; message: string; payload: any; timestamp: string }) => void;
  clearLogs: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  logs: [],
  addLog: (log) =>
    set((state) => ({
      // Guardamos un máximo de 50 logs en memoria para no saturar la UI
      logs: [{ id: crypto.randomUUID(), ...log }, ...state.logs].slice(0, 50),
    })),
  clearLogs: () => set({ logs: [] }),
}));
