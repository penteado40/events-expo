import { StyleSheet, Text, View } from 'react-native'

import { deviceToday, longDate } from '@/shared/domain/local-dates'
import { useSession } from '@/shared/session'
import { palette, textStyles } from '@/shared/theme'

/** The Group header's greeting (D-Início): today's date and "Olá, {first name}·". */
export function GroupGreeting() {
  const firstName = useSession((state) => state.session?.user.name.trim().split(/\s+/)[0] ?? '')

  return (
    <View style={styles.greeting}>
      <Text style={styles.date}>{longDate(deviceToday(new Date()))}</Text>
      <Text accessibilityRole="header" style={styles.hello}>
        Olá, {firstName}
        <Text style={{ color: palette.coral[100] }}>·</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  greeting: { gap: 2 },
  date: { ...textStyles.caption, fontSize: 14, color: palette.blue[100] },
  hello: { ...textStyles.display, color: '#FFFFFF' },
})
