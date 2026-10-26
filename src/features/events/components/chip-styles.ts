import { StyleSheet } from 'react-native'

import { colors, fonts, radii } from '@/shared/theme'

/** The Event chips (README "Eventos"): neutral "confirmados", lime "pendentes", muted "arquivado". */
export const chipStyles = StyleSheet.create({
  chip: { borderRadius: radii.chip, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 9 },
  neutral: { backgroundColor: colors.chipNeutralBg, borderColor: colors.chipNeutralBorder },
  neutralPressed: { backgroundColor: colors.chipNeutralPressedBg },
  accent: { backgroundColor: colors.chipAccentBg, borderColor: colors.chipAccentBorder },
  accentPressed: { backgroundColor: colors.chipAccentPressedBg },
  archived: { borderColor: colors.chipMutedBorder },
  text: { fontFamily: fonts.mono500, fontSize: 12, color: colors.textMuted },
  neutralText: { color: colors.text },
  accentText: { color: colors.accent },
})
