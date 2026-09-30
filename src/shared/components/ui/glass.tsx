import { BlurView } from 'expo-blur'
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import type { ReactNode } from 'react'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { materials, type GlassVariant } from '@/shared/theme'

import { useBlurTarget } from './blur-target'

const liquidGlass = isLiquidGlassAvailable()

/** Floating elements (tab bar, back button, sticky tabs, sheet) get real blur on Android too. */
const FLOATING: GlassVariant[] = ['pill', 'sheet']

type Props = {
  variant: GlassVariant
  radius: number
  /** Stronger top highlight, used for press feedback. */
  pressed?: boolean
  /**
   * Overrides of the material for one element (e.g. the tab bar's .2 border, "Sair"'s red one,
   * the accent stat's lighter tint).
   */
  tint?: string
  borderColor?: string
  highlight?: string
  shadow?: string
  /** Layout of the glass element itself (size, margins, flex). */
  style?: StyleProp<ViewStyle>
  /** Layout of the content inside (padding, gap, direction). */
  contentStyle?: StyleProp<ViewStyle>
  children?: ReactNode
}

/**
 * The only glass surface in the app. Native liquid glass on iOS 26+; elsewhere a frosted
 * fallback: blur (iOS always, Android only for floating variants) under the material's tint.
 * Both get the material's 1 px border and top highlight on top.
 */
export function Glass({
  variant,
  radius,
  pressed = false,
  style,
  contentStyle,
  children,
  ...overrides
}: Props) {
  const material = materials[variant]
  const blurTarget = useBlurTarget()
  const outer = { borderRadius: radius, boxShadow: overrides.shadow ?? material.shadow }
  const baseHighlight = overrides.highlight ?? material.highlight
  const highlight = pressed ? material.highlightPressed : baseHighlight
  const edge = (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: overrides.borderColor ?? material.border,
          boxShadow: `inset 0 1px 0 ${highlight}, inset 0 -1px 0 rgba(255,255,255,.06)`,
        },
      ]}
    />
  )

  if (liquidGlass) {
    return (
      <View style={[outer, style]}>
        <GlassView
          glassEffectStyle="regular"
          tintColor={overrides.tint ?? material.tint}
          colorScheme="dark"
          style={[{ flexGrow: 1, borderRadius: radius }, contentStyle]}
        >
          {children}
          {edge}
        </GlassView>
      </View>
    )
  }

  const blur =
    Platform.OS === 'ios' ? (
      <BlurView tint="dark" intensity={20} style={StyleSheet.absoluteFill} />
    ) : FLOATING.includes(variant) ? (
      <BlurView
        tint="dark"
        intensity={20}
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={blurTarget ?? undefined}
        style={StyleSheet.absoluteFill}
      />
    ) : null

  return (
    <View style={[outer, style]}>
      <View style={[{ flexGrow: 1, borderRadius: radius, overflow: 'hidden' }, contentStyle]}>
        {blur}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: overrides.tint ?? material.tint }]}
        />
        {children}
        {edge}
      </View>
    </View>
  )
}
