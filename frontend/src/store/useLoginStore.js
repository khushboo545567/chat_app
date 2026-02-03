import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set) => ({
      // STATE
      step: 1,
      userPhoneData: null,

      // ACTIONS
      setStep: (step) => set({ step }),

      setUserPhoneData: (data) => set({ userPhoneData: data }),

      resetLoginState: () => set({ step: 1, userPhoneData: null }),
    }),
    {
      name: "login-storage",

      // only these values will be saved in localStorage
      partialize: (state) => ({
        step: state.step,
        userPhoneData: state.userPhoneData,
      }),
    },
  ),
);

export default useLoginStore;
