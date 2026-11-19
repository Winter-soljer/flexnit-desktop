import { create } from "zustand";
import { UnifiedMedia } from "../types/movie";

interface MyListState {
  items: UnifiedMedia[];
  addItem: (item: UnifiedMedia) => void;
  removeItem: (id: number) => void;
  isInList: (id: number) => boolean;
  toggleItem: (item: UnifiedMedia) => void;
}

const STORAGE_KEY = "flexnit_my_list";

const loadFromStorage = (): UnifiedMedia[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items: UnifiedMedia[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
};

export const useMyListStore = create<MyListState>((set, get) => ({
  items: loadFromStorage(),

  addItem: (item) => {
    const { items } = get();
    if (!items.some((i) => i.id === item.id)) {
      const updated = [item, ...items];
      saveToStorage(updated);
      set({ items: updated });
    }
  },

  removeItem: (id) => {
    const { items } = get();
    const updated = items.filter((i) => i.id !== id);
    saveToStorage(updated);
    set({ items: updated });
  },

  isInList: (id) => {
    return get().items.some((i) => i.id === id);
  },

  toggleItem: (item) => {
    if (get().isInList(item.id)) {
      get().removeItem(item.id);
    } else {
      get().addItem(item);
    }
  },
}));
