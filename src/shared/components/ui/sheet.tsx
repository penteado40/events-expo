import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { palette, textStyles, useTheme } from '@/shared/theme'

type Props = {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * A low sheet (Media kit, Navegação e folhas): floating 8 pt off the edges, with the handle and the
 * title with the coral "·". Tapping outside or the system back closes it.
 */
export function Sheet({ visible, title, onClose, children }: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
        style={styles.overlay}
      />
      <View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, bottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {title}
          <Text style={{ color: palette.coral[500] }}>·</Text>
        </Text>
        {children}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(21,23,28,0.45)' },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
    boxShadow: '0 -10px 40px -10px rgba(21,23,28,0.4)',
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center' },
  title: { ...textStyles.title, fontSize: 22, lineHeight: 26 },
})
