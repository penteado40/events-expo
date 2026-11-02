import type { ColorSchemeName } from 'react-native'

/** Design D tokens (canvas "events-expo · Design D", Media kit: Cores and Tipografia). */

type Scale = Readonly<Record<'50' | '100' | '500' | '700' | '900', string>>

/**
 * The palette in 5 steps. 50: badge and tinted card background; 100: Team chip, soft border, text in
 * dark mode; 500: full color (end of a cover, Timeline dot); 700: text and icon in light mode; 900:
 * start of a cover, badge background in dark mode.
 */
export const palette = {
  /** Identity: the app's bars, buttons, links, active tab. Never an Event's or Team's tone. */
  blue: { 50: '#EEF3FB', 100: '#DBE7FF', 500: '#2F63C9', 700: '#1F4FAE', 900: '#10204A' },
  coral: { 50: '#FFF4F2', 100: '#FFE2DC', 500: '#EF5A3C', 700: '#AB331C', 900: '#52170C' },
  green: { 50: '#EEFBF2', 100: '#D3F3DD', 500: '#1FB86A', 700: '#057743', 900: '#0D3B3A' },
  purple: { 50: '#F8F5FE', 100: '#EDE5FE', 500: '#A06AEC', 700: '#7347AF', 900: '#352053' },
  pink: { 50: '#FEF4F7', 100: '#FEE0EB', 500: '#DF4E92', 700: '#A43068', 900: '#4E1530' },
  turquoise: { 50: '#EAFBFC', 100: '#C8F3F5', 500: '#069FA6', 700: '#057176', 900: '#023538' },
  gold: { 50: '#FDF6EA', 100: '#FAE7C8', 500: '#B68103', 700: '#815B04', 900: '#3E2A00' },
  /** Only for Cancelled. */
  red: { 50: '#FFF4F5', 100: '#FFE1E4', 500: '#D93A52', 700: '#AA2E4A', 900: '#511522' },
  /** Text, borders, Event items; the removed (ghost) state. */
  gray: { 50: '#F6F7F9', 100: '#ECEEF3', 500: '#8A909C', 700: '#5B6170', 900: '#15171C' },
} as const satisfies Record<string, Scale>

/** A tone a badge, chip or cover can take: any palette scale. */
export type Tone = keyof typeof palette

export type ColorScheme = 'light' | 'dark'

type Colors = {
  bg: string
  /** Cards. */
  surface: string
  surfaceBrand: string
  text: string
  textMuted: string
  /** Text fields and outlined buttons. */
  border: string
  /** Hairlines inside a card (the "ou" of the login). */
  divider: string
  /** Buttons and the floating bar: always blue, even inside a colored Event. */
  action: string
  onAction: string
  link: string
  /** Inactive icons on the floating bar. */
  onActionMuted: string
}

/** Two colors of a gradient, from its top-left start to its bottom-right end. */
export type Gradient = readonly [string, string]

export type Theme = {
  scheme: ColorScheme
  colors: Colors
  /** The Group's header: blue 900 → 500, in both modes. */
  header: Gradient
  /** A state badge, always with text: coral changed/new, green now/going, gold Draft, red Cancelled, gray removed. */
  badge: (tone: Tone) => { bg: string; text: string }
  teamChip: (tone: Tone) => { bg: string; text: string }
  /** An Event's cover, the same in both modes. */
  cover: (tone: Tone) => Gradient
  timelineDot: (tone: Tone) => string
}

const shared = {
  header: [palette.blue[900], palette.blue[500]],
  cover: (tone: Tone) => [palette[tone][900], palette[tone][500]],
  timelineDot: (tone: Tone) => palette[tone][500],
} as const satisfies Partial<Theme>

const light: Theme = {
  ...shared,
  scheme: 'light',
  colors: {
    bg: palette.gray[50],
    surface: '#FFFFFF',
    surfaceBrand: palette.blue[50],
    text: palette.gray[900],
    textMuted: palette.gray[700],
    border: '#C9CDD6',
    divider: palette.gray[100],
    action: palette.blue[700],
    onAction: '#FFFFFF',
    link: palette.blue[700],
    onActionMuted: palette.blue[100],
  },
  badge: (tone) => ({ bg: palette[tone][50], text: palette[tone][700] }),
  teamChip: (tone) => ({ bg: palette[tone][100], text: palette[tone][700] }),
}

const dark: Theme = {
  ...shared,
  scheme: 'dark',
  colors: {
    bg: '#0E1320',
    surface: '#171D2B',
    surfaceBrand: '#142038',
    text: '#F2F4F8',
    textMuted: '#A7AEBD',
    border: '#3A4357',
    divider: '#252D3E',
    action: palette.blue[500],
    onAction: '#FFFFFF',
    link: palette.blue[100],
    onActionMuted: palette.blue[100],
  },
  badge: (tone) => ({ bg: palette[tone][900], text: palette[tone][100] }),
  teamChip: (tone) => ({ bg: palette[tone][900], text: palette[tone][100] }),
}

/** The theme for the system's color scheme; light when it has no preference. */
export const themeFor = (scheme: ColorSchemeName | null | undefined): Theme =>
  scheme === 'dark' ? dark : light

export const fonts = {
  sans400: 'Outfit_400Regular',
  sans500: 'Outfit_500Medium',
  sans600: 'Outfit_600SemiBold',
  sans700: 'Outfit_700Bold',
  /** Only for links and codes. */
  mono400: 'IBMPlexMono_400Regular',
  mono500: 'IBMPlexMono_500Medium',
} as const

/** Type scale (Media kit: Tipografia). Colors come from the theme. */
export const textStyles = {
  display: { fontFamily: fonts.sans700, fontSize: 30, lineHeight: 33 },
  title: { fontFamily: fonts.sans700, fontSize: 28, lineHeight: 31 },
  day: { fontFamily: fonts.sans700, fontSize: 20 },
  cardTitle: { fontFamily: fonts.sans600, fontSize: 16 },
  body: { fontFamily: fonts.sans400, fontSize: 15 },
  caption: { fontFamily: fonts.sans400, fontSize: 13 },
  label: {
    fontFamily: fonts.sans700,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  /** Never below 11 px; badges at 11 only in caps and 700. */
  badge: { fontFamily: fonts.sans700, fontSize: 11, textTransform: 'uppercase' },
  /** Tabular digits, so the Timeline's columns line up. */
  time: { fontFamily: fonts.sans700, fontSize: 15, fontVariant: ['tabular-nums'] },
  mono: { fontFamily: fonts.mono400, fontSize: 13 },
} as const

export const spacing = {
  screen: 16,
  /** Minimum touch target. */
  touchTarget: 44,
  /** Bottom padding that keeps scrolling content clear of the floating bar. */
  tabBarClearance: 112,
} as const
