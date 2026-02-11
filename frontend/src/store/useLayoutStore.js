import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTabs: "chats",
      selectedContact: null,

      setSelectedContact: (contact) => set({ selectedContact: contact }),

      setActiveTab: (tab) => set({ activeTabs: tab }),
    }),
    {
      name: "layout-store",
    },
  ),
);

export default useLayoutStore;
