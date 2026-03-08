"use client";

import { create } from "zustand";

interface AdminUiState {
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  globalSearch: "",
  setGlobalSearch: (value) => set({ globalSearch: value }),
}));