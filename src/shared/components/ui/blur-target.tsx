import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'
import type { View } from 'react-native'

/**
 * On Android, expo-blur blurs a `BlurTargetView` instead of whatever is behind it. The fixed
 * Background is that target, so floating glass (tab bar, sheet) blurs the orbs and grid.
 */
const BlurTargetContext = createContext<RefObject<View | null> | null>(null)

export function BlurTargetProvider({ children }: { children: ReactNode }) {
  const ref = useRef<View | null>(null)
  return <BlurTargetContext.Provider value={ref}>{children}</BlurTargetContext.Provider>
}

export const useBlurTarget = () => useContext(BlurTargetContext)
