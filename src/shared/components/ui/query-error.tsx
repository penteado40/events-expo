import { StyleSheet, Text, View } from 'react-native'

import { colors, fonts, radii } from '@/shared/theme'

import { ErrorBox } from './error-box'
import { PressableGlass } from './pressable-glass'

/** A failed query: the login's error box (message only) and "Tentar de novo". */
export function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <ErrorBox message={message} />
      <PressableGlass
        variant="pill"
        radius={radii.pillButton}
        onPress={onRetry}
        accessibilityLabel="Tentar de novo"
        contentStyle={styles.button}
      >
        <Text style={styles.label}>Tentar de novo</Text>
      </PressableGlass>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  button: { height: 48, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.sans500, fontSize: 15, color: colors.text },
})
