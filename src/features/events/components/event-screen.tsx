import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge, Button, ErrorState, Icon, ListSkeleton } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, roleIn, seesDrafts } from '@/shared/domain/group-role'
import { periodLabel } from '@/shared/domain/local-dates'
import { gmtOffset } from '@/shared/domain/timezones'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import { useEvent } from '../hooks/use-event'
import { useSchedule } from '../hooks/use-schedule'
import { assembleSchedule } from '../schedule-lines'

/**
 * An Event's screen (D-Rascunho, PROJ-217, PROJ-220): the cover in its automatic color, and the
 * card over it with the name, where and when in its timezone. Owners see the Draft, "Editar" and
 * the schedule in short (the General info and a line per day, with "+ Item"), which opens the
 * Timeline; a Viewer only where and when. Participants and Publicar come with their own tickets.
 */
export function EventScreen({ eventId }: { eventId: number }) {
  const theme = useTheme()
  const { colors } = theme
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useSession((state) => state.session?.user)
  const event = useEvent(eventId)
  const role = event.data && user ? roleIn(user, event.data.groupId) : null
  const tone = autoTone(eventId)
  const [from, to] = theme.cover(tone)

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
            {event.data && role && canEditEvent(role, event.data) && (
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
            <>
              <EventCard event={event.data} draftShown={!!role && seesDrafts(role)} />
              {role && seesDrafts(role) && (
                <ScheduleSummary event={event.data} editable={canEditEvent(role, event.data)} />
              )}
            </>
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
        event.state === 'DRAFT' &&
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

/** D-Rascunho's "Programação": the General info in a line, then one line per day with items. */
function ScheduleSummary({ event, editable }: { event: Event; editable: boolean }) {
  const { colors } = useTheme()
  const router = useRouter()
  const schedule = useSchedule(event.id)
  const openTimeline = () => router.push(`/events/${event.id}/timeline`)
  const lines = schedule.data && assembleSchedule(schedule.data, event.period)
  const rows = lines
    ? [
        ...(lines.generalInfo.length > 0
          ? [
              {
                key: 'info',
                label: 'INFO',
                names: lines.generalInfo.map((l) => l.name).join(' · '),
                count: lines.generalInfo.length,
                outsidePeriod: false,
              },
            ]
          : []),
        ...lines.days.map((day) => ({
          key: day.date,
          label: day.heading,
          names: day.items.map((l) => l.name).join(', '),
          count: day.items.length,
          outsidePeriod: day.outsidePeriod,
        })),
      ]
    : []

  return (
    <View style={[styles.schedule, { backgroundColor: colors.surface }]}>
      <View style={styles.scheduleHeader}>
        <Text accessibilityRole="header" style={[styles.scheduleTitle, { color: colors.text }]}>
          Programação
        </Text>
        {editable && (
          <Pressable
            onPress={() => router.push(`/events/${event.id}/items/new`)}
            accessibilityRole="button"
            accessibilityLabel="+ Item"
            style={[styles.addItem, { backgroundColor: colors.action }]}
          >
            <Text style={[styles.addItemLabel, { color: colors.onAction }]}>+ Item</Text>
          </Pressable>
        )}
      </View>
      {schedule.error ? (
        <ErrorState message={schedule.error.message} onRetry={() => schedule.refetch()} />
      ) : !lines ? (
        <ListSkeleton />
      ) : lines.isEmpty ? (
        <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
          Nenhum item ainda.
        </Text>
      ) : (
        <>
          {rows.map((row, i) => (
            <Pressable
              key={row.key}
              onPress={openTimeline}
              accessibilityRole="button"
              accessibilityLabel={[
                row.key === 'info' ? 'Informações gerais' : row.label,
                row.names,
                row.outsidePeriod ? 'fora do período' : `${row.count}`,
              ].join(', ')}
              style={[
                styles.scheduleRow,
                i < rows.length - 1 && { borderBottomWidth: 1, borderColor: colors.divider },
              ]}
            >
              <Text
                style={[
                  row.key === 'info' ? styles.infoLabel : styles.dayLabel,
                  {
                    color: row.outsidePeriod
                      ? palette.gold[700]
                      : row.key === 'info'
                        ? colors.textMuted
                        : palette[autoTone(event.id)][700],
                  },
                ]}
              >
                {row.label}
              </Text>
              <Text numberOfLines={1} style={[styles.rowNames, { color: colors.text }]}>
                {row.names}
              </Text>
              {row.outsidePeriod ? (
                <Badge label="FORA DO PERÍODO" tone="gold" />
              ) : (
                <Text style={[styles.rowCount, { color: colors.textMuted }]}>{row.count}</Text>
              )}
            </Pressable>
          ))}
          <Button label="Abrir a Timeline" variant="link" onPress={openTimeline} />
        </>
      )}
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
  schedule: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 4 },
  scheduleHeader: {
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: { fontFamily: fonts.sans700, fontSize: 16 },
  addItem: { height: 36, paddingHorizontal: 12, borderRadius: 18, justifyContent: 'center' },
  addItemLabel: { fontFamily: fonts.sans600, fontSize: 13 },
  empty: { paddingVertical: 12 },
  scheduleRow: {
    minHeight: spacing.touchTarget,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: { width: 52, fontFamily: fonts.sans700, fontSize: 11 },
  dayLabel: { width: 52, fontFamily: fonts.sans700, fontSize: 13 },
  rowNames: { flex: 1, fontFamily: fonts.sans600, fontSize: 15 },
  rowCount: { fontFamily: fonts.sans400, fontSize: 13 },
})
