/** Design tokens from docs/design/README.md. */

export const colors = {
  bg: '#07080a',
  text: '#f2f1ee',
  textMuted: 'rgba(255,255,255,.66)',
  textSoft: 'rgba(255,255,255,.78)',
  accent: '#b5e35a',
  accentGlow: 'rgba(181,227,90,.6)',
  onAccent: '#0f1011',
  verified: '#9cc4ff',
  danger: '#ff9a86',
  dangerBorder: 'rgba(255,154,134,.3)',
  warning: '#f0c24b',
  rsvpNo: 'rgba(255,255,255,.4)',
  divider: 'rgba(255,255,255,.08)',
  dividerSheet: 'rgba(255,255,255,.12)',
  activePill: 'rgba(255,255,255,.88)',
  tabInactive: 'rgba(255,255,255,.75)',
  inputBg: 'rgba(0,0,0,.28)',
  inputBorder: 'rgba(255,255,255,.14)',
  errorBg: 'rgba(60,18,12,.55)',
  errorBorder: 'rgba(255,154,134,.35)',
  errorText: '#f3d6cf',
  secondaryButtonBg: 'rgba(255,255,255,.06)',
  secondaryButtonBorder: 'rgba(255,255,255,.16)',
  chipMutedBorder: 'rgba(255,255,255,.18)',
  chipAccentBg: 'rgba(181,227,90,.16)',
  chipAccentBorder: 'rgba(181,227,90,.35)',
  heroSubtitle: 'rgba(255,255,255,.8)',
  skeleton: 'rgba(255,255,255,.1)',
  orbBlue: '#4f7dff',
  orbViolet: '#b36bff',
  gridLine: 'rgba(255,255,255,.05)',
} as const

export const fonts = {
  sans400: 'IBMPlexSans_400Regular',
  sans500: 'IBMPlexSans_500Medium',
  sans600: 'IBMPlexSans_600SemiBold',
  mono400: 'IBMPlexMono_400Regular',
  mono500: 'IBMPlexMono_500Medium',
} as const

export const radii = {
  chip: 10,
  input: 16,
  stat: 22,
  segmentedTabs: 24,
  segmentedTab: 19,
  eventCard: 24,
  pillButton: 26,
  backButton: 22,
  heroCard: 26,
  loginCard: 28,
  primaryButton: 28,
  tabBar: 32,
  tabBarItem: 26,
  sheet: 40,
} as const

export const spacing = {
  screen: 16,
  cardGap: 12,
  cardPadding: 16,
  /** Side padding of the Event detail's header. */
  eventHeader: 22,
  /** Bottom padding that keeps scrolling content clear of the floating tab bar. */
  tabBarClearance: 120,
} as const

/** Text styles repeated across screens. */
export const textStyles = {
  screenTitle: { fontFamily: fonts.sans600, fontSize: 32, color: colors.text },
  /** Mono 12 muted: meta lines. */
  monoCaption: { fontFamily: fonts.mono400, fontSize: 12, color: colors.textMuted },
} as const

export type GlassVariant = 'card' | 'accent' | 'pill' | 'sheet'

type Material = {
  tint: string
  border: string
  highlight: string
  /** Stronger top highlight while pressed. */
  highlightPressed: string
  shadow: string
}

/** Glass materials (README "Materiais de vidro"). */
export const materials: Record<GlassVariant, Material> = {
  card: {
    tint: 'rgba(255,255,255,.06)',
    border: 'rgba(255,255,255,.16)',
    highlight: 'rgba(255,255,255,.3)',
    highlightPressed: 'rgba(255,255,255,.55)',
    shadow: '0 16px 40px -16px rgba(0,0,0,.6)',
  },
  accent: {
    tint: 'rgba(181,227,90,.14)',
    border: 'rgba(181,227,90,.35)',
    highlight: 'rgba(255,255,255,.35)',
    highlightPressed: 'rgba(255,255,255,.6)',
    shadow: '0 16px 40px -16px rgba(0,0,0,.6)',
  },
  pill: {
    tint: 'rgba(255,255,255,.08)',
    border: 'rgba(255,255,255,.18)',
    highlight: 'rgba(255,255,255,.35)',
    highlightPressed: 'rgba(255,255,255,.6)',
    shadow: '0 12px 30px -12px rgba(0,0,0,.6)',
  },
  sheet: {
    tint: 'rgba(30,32,36,.45)',
    border: 'rgba(255,255,255,.2)',
    highlight: 'rgba(255,255,255,.4)',
    highlightPressed: 'rgba(255,255,255,.6)',
    shadow: '0 -10px 50px -10px rgba(0,0,0,.6)',
  },
}

/** The accent stat's overrides of the Card accent material (README: ".12 nos stats"). */
export const accentStatGlass = {
  tint: 'rgba(181,227,90,.12)',
  borderColor: 'rgba(181,227,90,.32)',
  highlight: 'rgba(255,255,255,.3)',
} as const

/** The tab bar's overrides of the Pill material (README "Materiais de vidro"). */
export const tabBarGlass = {
  borderColor: 'rgba(255,255,255,.2)',
  highlight: 'rgba(255,255,255,.4)',
  shadow: '0 18px 40px -12px rgba(0,0,0,.7)',
} as const
