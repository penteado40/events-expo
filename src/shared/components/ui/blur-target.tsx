import { BlurTargetView } from 'expo-blur'
import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'
import { StyleSheet, type View } from 'react-native'

type Targets = { background: RefObject<View | null>; screen: RefObject<View | null> }

/**
 * On Android, expo-blur blurs a `BlurTargetView` instead of whatever is behind it. The fixed
 * Background is one target, so floating glass (tab bar, sheet) blurs the orbs and grid. The whole
 * screen (Background, content and tab bar) is the other, for the veil drawn over all of it.
 */
const BlurTargetContext = createContext<Targets | null>(null)

export function BlurTargetProvider({ children }: { children: ReactNode }) {
  const background = useRef<View | null>(null)
  const screen = useRef<View | null>(null)
  return (
    <BlurTargetContext.Provider value={{ background, screen }}>
      {children}
    </BlurTargetContext.Provider>
  )
}

/** The Background's target: what floating glass blurs. */
export const useBlurTarget = () => useContext(BlurTargetContext)?.background ?? null

/** The whole screen's target: what the veil blurs. */
export const useScreenBlurTarget = () => useContext(BlurTargetContext)?.screen ?? null

/** Wraps the screen (Background and navigator) so the veil can blur it on Android. */
export function ScreenBlurTarget({ children }: { children: ReactNode }) {
  const screen = useScreenBlurTarget()
  return (
    <BlurTargetView ref={screen ?? undefined} style={styles.fill}>
      {children}
    </BlurTargetView>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
