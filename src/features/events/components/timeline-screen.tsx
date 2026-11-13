import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge, Button, ErrorState, Icon, ListSkeleton, Sheet } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, roleIn, seesDrafts } from '@/shared/domain/group-role'
import { weekday } from '@/shared/domain/local-dates'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import { useEvent } from '../hooks/use-event'
import { useDeleteItem } from '../hooks/use-item-writes'
import { useSchedule } from '../hooks/use-schedule'
import {
  assembleSchedule,
  type DayLines,
  type ItemLine,
  type ScheduleLines,
} from '../schedule-lines'

/**
 * The Owner's Timeline (D-Timeline, PROJ-220): the General info, then day by day, each item at the
 * local time of its place, the untimed ("a definir") first; a day outside the Event's period is
 * marked. A day picker on the cover jumps to its day. An item opens its actions (editar, apagar).
 */
export function TimelineScreen({ eventId }: { eventId: number }) {
  const { colors } = useTheme()
  const user = useSession((state) => state.session?.user)
  const event = useEvent(eventId)
  const role = event.data && user ? roleIn(user, event.data.groupId) : null
  const schedule = useSchedule(eventId, { enabled: role !== null && seesDrafts(role) })

  if (event.data && role && !seesDrafts(role)) {
    return (
      <View style={[styles.screen, styles.padded, { backgroundColor: colors.bg }]}>
        <Text style={[textStyles.body, { color: colors.textMuted }]}>
          A programação aparece aqui quando o Event for publicado.
        </Text>
      </View>
    )
  }
  if (event.data && schedule.data) {
    return (
      <Timeline
        event={event.data}
        lines={assembleSchedule(schedule.data, event.data.period)}
        editable={!!role && canEditEvent(role, event.data)}
      />
    )
  }
  const error = event.error ?? schedule.error
  return (
    <View style={[styles.screen, styles.padded, { backgroundColor: colors.bg }]}>
      {error ? (
        <ErrorState
          message={error.message}
          onRetry={() => (event.error ? event.refetch() : schedule.refetch())}
        />
      ) : (
        <ListSkeleton />
      )}
    </View>
  )
}

function Timeline({
  event,
  lines,
  editable,
}: {
  event: Event
  lines: ScheduleLines
  editable: boolean
}) {
  const theme = useTheme()
  const { colors } = theme
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scroll = useRef<ScrollViewInstance>(null)
  const dayTops = useRef(new Map<string, number>())
  const [chosen, setChosen] = useState<ItemLine | null>(null)
  const tone = autoTone(event.id)
  const [from, to] = theme.cover(tone)
  const muted = palette[tone][100]

  const jumpTo = (date: string) => {
    const top = dayTops.current.get(date)
    if (top !== undefined) scroll.current?.scrollTo({ y: top, animated: true })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView ref={scroll} contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
            },
          ]}
        >
          <View style={styles.bar}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.back}
            >
              <Icon name="back" color="#FFFFFF" size={20} strokeWidth={2} />
            </Pressable>
            <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
              {event.name}
            </Text>
            {editable ? (
              <Pressable
                onPress={() => router.push(`/events/${event.id}/items/new`)}
                accessibilityRole="button"
                accessibilityLabel="+ Item"
                style={styles.add}
              >
                <Text style={styles.addLabel}>+ Item</Text>
              </Pressable>
            ) : (
              <View style={styles.back} />
            )}
          </View>
          {lines.days.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {lines.days.map((day) => (
                <Pressable
                  key={day.date}
                  onPress={() => jumpTo(day.date)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ir para ${day.heading}`}
                  style={styles.chip}
                >
                  <Text style={[styles.chipWeekday, { color: muted }]}>
                    {weekday(day.date).replace('.', '')}
                  </Text>
                  <Text style={styles.chipDay}>{day.heading.split(' ')[1]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Text style={[styles.caption, { color: muted }]}>
            Cada hora é a do lugar onde o item acontece
          </Text>
        </View>

        <View style={styles.body}>
          {lines.isEmpty && (
            <Text style={[textStyles.body, { color: colors.textMuted }]}>
              Nenhum item ainda.{editable ? ' Toque em + Item para começar.' : ''}
            </Text>
          )}
          {lines.generalInfo.length > 0 && (
            <View style={styles.day}>
              <Heading label="Informações gerais" />
              {lines.generalInfo.map((line) => (
                <ItemRow
                  key={line.id}
                  line={line}
                  onPress={editable ? setChosen : undefined}
                  general
                />
              ))}
            </View>
          )}
          {lines.days.map((day) => (
            <View
              key={day.date}
              style={styles.day}
              onLayout={(e) => dayTops.current.set(day.date, e.nativeEvent.layout.y)}
            >
              <DayHeading day={day} />
              {day.items.map((line) => (
                <ItemRow key={line.id} line={line} onPress={editable ? setChosen : undefined} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {chosen && <ItemActions event={event} line={chosen} onClose={() => setChosen(null)} />}
    </View>
  )
}

function Heading({ label }: { label: string }) {
  const { colors } = useTheme()
  return (
    <Text accessibilityRole="header" style={[styles.dayHeading, { color: colors.text }]}>
      {label}
      <Text style={{ color: palette.coral[500] }}>·</Text>
    </Text>
  )
}

function DayHeading({ day }: { day: DayLines }) {
  return (
    <View style={styles.dayHeadingRow}>
      <Heading label={day.heading} />
      {day.outsidePeriod && <Badge label="FORA DO PERÍODO" tone="gold" />}
    </View>
  )
}

/** One item: its local time (or "a definir"), the dot, and the card with the name and the place. */
function ItemRow({
  line,
  onPress,
  general = false,
}: {
  line: ItemLine
  onPress?: (line: ItemLine) => void
  general?: boolean
}) {
  const theme = useTheme()
  const { colors } = theme
  const untimed = line.time === null
  const when = general ? '' : (line.time ?? 'a definir')
  const label = [when, line.name, line.detail].filter(Boolean).join(', ')
  return (
    <Pressable
      onPress={onPress && (() => onPress(line))}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={styles.row}
    >
      {!general && (
        <Text
          style={[
            untimed ? styles.untimed : styles.time,
            { color: untimed ? colors.textMuted : colors.text },
          ]}
        >
          {when}
        </Text>
      )}
      <View
        style={[
          styles.dot,
          untimed
            ? {
                borderStyle: 'dashed',
                borderColor: palette.purple[500],
                backgroundColor: colors.bg,
              }
            : { borderColor: palette.purple[500], backgroundColor: colors.surface },
        ]}
      />
      <View
        style={[
          styles.card,
          untimed && !general
            ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border }
            : { backgroundColor: colors.surface },
        ]}
      >
        <Text style={[styles.itemName, { color: colors.text }]}>{line.name}</Text>
        {(line.detail || (untimed && !general)) && (
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {line.detail ?? 'horário a confirmar'}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

/** D-AcoesItem, for now with "Editar" and "Apagar" (with a confirmation). */
function ItemActions({
  event,
  line,
  onClose,
}: {
  event: Event
  line: ItemLine
  onClose: () => void
}) {
  const { colors } = useTheme()
  const router = useRouter()
  const remove = useDeleteItem(event.id)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmRemove = async () => {
    setError(null)
    try {
      await remove.mutateAsync(line.id)
      onClose()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível apagar.')
    }
  }

  if (confirming) {
    return (
      <Sheet visible title={`Apagar ${line.name}?`} onClose={onClose}>
        <Text style={[textStyles.body, { color: colors.textMuted }]}>
          O item sai da programação e não dá para desfazer.
        </Text>
        {error && <Text style={[textStyles.body, { color: palette.red[700] }]}>{error}</Text>}
        <Button
          label="Apagar"
          variant="danger"
          loading={remove.isPending}
          onPress={confirmRemove}
        />
        <Button label="Voltar" variant="link" onPress={() => setConfirming(false)} />
      </Sheet>
    )
  }
  return (
    <Sheet visible title={line.name} onClose={onClose}>
      {line.detail && (
        <Text style={[textStyles.body, { color: colors.textMuted }]}>{line.detail}</Text>
      )}
      <Button
        label="Editar"
        variant="secondary"
        onPress={() => {
          onClose()
          router.push(`/events/${event.id}/items/${line.id}`)
        }}
      />
      <Button label="Apagar" variant="danger" onPress={() => setConfirming(true)} />
    </Sheet>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { padding: 20, paddingTop: 80 },
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sans600,
    fontSize: 17,
    color: '#FFFFFF',
  },
  add: {
    height: spacing.touchTarget,
    paddingHorizontal: 14,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  addLabel: { fontFamily: fonts.sans600, fontSize: 14, color: '#FFFFFF' },
  chips: { gap: 10 },
  chip: {
    width: 64,
    height: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWeekday: { fontFamily: fonts.sans400, fontSize: 13 },
  chipDay: { fontFamily: fonts.sans700, fontSize: 22, lineHeight: 24, color: '#FFFFFF' },
  caption: { fontFamily: fonts.sans400, fontSize: 13, textAlign: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  day: { gap: 10 },
  dayHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayHeading: { fontFamily: fonts.sans700, fontSize: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: spacing.touchTarget },
  time: { width: 52, fontFamily: fonts.sans700, fontSize: 15 },
  untimed: { width: 52, fontFamily: fonts.sans600, fontSize: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5 },
  card: { flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  itemName: { fontFamily: fonts.sans600, fontSize: 15 },
  detail: { fontFamily: fonts.sans400, fontSize: 12 },
})
