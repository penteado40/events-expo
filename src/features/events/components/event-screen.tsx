import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge, ErrorState, Icon, ListSkeleton } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, roleIn, seesDrafts } from '@/shared/domain/group-role'
import { gmtOffset, periodLabel } from '@/shared/domain/local-dates'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import { useEvent } from '../hooks/use-event'

/**
 * An Event's screen (D-Rascunho, PROJ-217): the cover in its automatic color, and the card over it
 * with the name, where and when in its timezone. Owners see the Draft and "Editar"; a Viewer only
 * where and when. The schedule, Participants and Publicar come with their own tickets.
 */
export function EventScreen({ eventId }: { eventId: number }) {
  const { colors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useSession((state) => state.session?.user)
  const event = useEvent(eventId)
  const tone = autoTone(eventId)
  const [from, to] = useTheme().cover(tone)

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.cover,
            {
              height: insets.top + 150,
              backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            },
          ]}
        >
          <View style={[styles.coverBar, { top: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.back}
            >
              <Icon name="back" color="#FFFFFF" size={20} strokeWidth={2} />
            </Pressable>
            {event.data && user && canEditEvent(roleIn(user, event.data.groupId), event.data) && (
              <Pressable
                onPress={() => router.push(`/events/${eventId}/edit`)}
                accessibilityRole="button"
                accessibilityLabel="Editar"
                style={styles.edit}
              >
                <Text style={styles.editLabel}>Editar</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {event.data ? (
            <EventCard
              event={event.data}
              draftShown={!!user && seesDrafts(roleIn(user, event.data.groupId))}
            />
          ) : event.error ? (
            <ErrorState message={event.error.message} onRetry={() => event.refetch()} />
          ) : (
            <ListSkeleton />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function EventCard({ event, draftShown }: { event: Event; draftShown: boolean }) {
  const theme = useTheme()
  const { colors } = theme
  const tone = autoTone(event.id)
  const { period } = event
  const where = [event.place, periodLabel(period), gmtOffset(period.timezone, period.startDate)]

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          boxShadow: `0 18px 32px -18px ${palette[tone][900]}80`,
        },
      ]}
    >
      {event.cancelled ? (
        <Badge label="CANCELADO" tone="red" />
      ) : (
        event.status === 'DRAFT' &&
        draftShown && <Badge label="RASCUNHO · o Group vê só onde e quando" tone="gold" />
      )}
      <Text
        accessibilityRole="header"
        style={[styles.name, { color: colors.text }, event.cancelled && styles.struck]}
      >
        {event.name}
      </Text>
      <Text style={[styles.where, { color: theme.badge(tone).text }]}>{where.join(' · ')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 32 },
  cover: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  coverBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  edit: {
    height: spacing.touchTarget,
    paddingHorizontal: 16,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  editLabel: { fontFamily: fonts.sans600, fontSize: 14, color: '#FFFFFF' },
  body: { marginTop: -70, paddingHorizontal: 16, gap: 14 },
  card: { borderRadius: 24, padding: 16, gap: 8 },
  name: { fontFamily: fonts.sans700, fontSize: 26, lineHeight: 30 },
  struck: { textDecorationLine: 'line-through' },
  where: { fontFamily: fonts.sans600, fontSize: 14 },
})
