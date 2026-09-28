import { createJSONStorage } from 'zustand/middleware'

/**
 * Web has no keychain (expo-secure-store is native only). Web is not a target platform; this
 * fallback only lets `expo start --web` be used as a development preview.
 */
export const secureJSONStorage = createJSONStorage(() => window.localStorage)
