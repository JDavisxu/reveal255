// stores/useConsoleStore.ts
import create from "zustand";

interface ConsoleState {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
}));
