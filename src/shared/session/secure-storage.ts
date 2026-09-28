import * as SecureStore from 'expo-secure-store'
import { createJSONStorage } from 'zustand/middleware'

/** Zustand `persist` storage backed by the device keychain (expo-secure-store). */
export const secureJSONStorage = createJSONStorage(() => ({
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
}))
