import { StyleSheet, View } from 'react-native'

import { Button } from './button'
import { Notice } from './notice'

/** A failed load: the message, never a code, and "Tentar de novo". */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.box}>
      <Notice message={message} />
      <Button label="Tentar de novo" onPress={onRetry} />
    </View>
  )
}

const styles = StyleSheet.create({ box: { gap: 14 } })
