import { persist } from "zustand/middleware";
import { create } from "zustand";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTabs: "chats",
      selectedContet: null,
      setSelectedContact: (contact) => set({ selectedContet: contact }),
      setActiveTab: (tab) => set({ setActiveTab: tab }),
    }),
    {
      name: "Active-state-store",
      getStorage: () => localStorage,
    },
  ),
);

export default useLayoutStore;
