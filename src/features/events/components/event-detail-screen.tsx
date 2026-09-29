import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PressableGlass, QueryError, SkeletonBlock } from '@/shared/components/ui'
import { roleLabel } from '@/shared/domain/roles'
import { colors, fonts, radii, spacing, textStyles } from '@/shared/theme'

import { useEvent } from '../hooks/use-events'

const BACK_SIZE = 44

/** The Event detail. For now its top bar and name (PROJ-87); PROJ-88 grows the rest. */
export function EventDetailScreen({ id }: { id: number }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const event = useEvent(id)

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.bar}>
        <PressableGlass
          variant="pill"
          radius={radii.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          contentStyle={styles.back}
        >
          <Text style={styles.backArrow}>←</Text>
        </PressableGlass>
        <Text style={[textStyles.monoCaption, styles.barTitle]} numberOfLines={1}>
          {event.data ? `#${event.data.id} · ${roleLabel(event.data.membership)}` : `#${id}`}
        </Text>
      </View>

      <View style={styles.header}>
        {event.data ? (
          <Text style={styles.name}>{event.data.name}</Text>
        ) : event.isError ? (
          <QueryError message={event.error.message} onRetry={() => event.refetch()} />
        ) : (
          <SkeletonBlock width="75%" height={32} radius={10} />
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14 },
  back: { width: BACK_SIZE, height: BACK_SIZE, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontFamily: fonts.sans400, fontSize: 18, color: colors.text },
  // Offsets the back button, so the caption sits in the middle of the screen.
  barTitle: { flex: 1, textAlign: 'center', paddingRight: BACK_SIZE + 6 },
  header: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: spacing.eventHeader },
  name: { fontFamily: fonts.sans600, fontSize: 30, lineHeight: 34, color: colors.text },
})
