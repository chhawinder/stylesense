import { create } from 'zustand'

const usePreferencesStore = create((set) => ({
  occasions: [],
  styles: [],
  platforms: ['Amazon'],
  budgetMin: 500,
  budgetMax: 10000,

  setOccasions: (occasions) => set({ occasions }),
  setStyles: (styles) => set({ styles }),
  setPlatforms: (platforms) => set({ platforms }),
  setBudget: (min, max) => set({ budgetMin: min, budgetMax: max }),

  toggle: (field, value) =>
    set((state) => {
      const arr = state[field]
      return {
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    }),
}))

export default usePreferencesStore
