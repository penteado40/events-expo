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
import { canEditEvent, roleIn, seesDrafts, type GroupRole } from '@/shared/domain/group-role'
import { weekday } from '@/shared/domain/local-dates'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import type { ItemField } from '../schemas'
import { useEvent } from '../hooks/use-event'
import { useDeleteItem, useMoveItem, type ItemMove } from '../hooks/use-item-writes'
import { useSchedule } from '../hooks/use-schedule'
import {
  audienceMark,
  DRAFT_BADGE,
  hasActions,
  ITEM_STATE_MARKS,
  itemActions,
  lastChangeText,
} from '../item-state'
import {
  assembleSchedule,
  type DayLines,
  type ItemLine,
  type ScheduleLines,
} from '../schedule-lines'

/**
 * The Owner's Timeline (D-Timeline, PROJ-220, PROJ-234): the whole schedule, Drafts and every
 * Audience included, the General info, then day by day, each item at the local time of its place,
 * the untimed ("a definir") first; a day outside the Event's period is marked. A day picker on the
 * cover jumps to its day. An item in Draft has "RASCUNHO"; a Cancelled one "CANCELADO" and its name
 * struck; one of a chosen list, how many it has ("SÓ 3 PESSOAS"). An item with actions for the
 * person (`itemActions`: editar, publicar, cancelar, descancelar, apagar) opens them, with its last
 * change; a Cancelled Event has none.
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
  if (event.data && schedule.data && role) {
    return (
      <Timeline
        event={event.data}
        lines={assembleSchedule(schedule.data, event.data.period)}
        role={role}
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

function Timeline({ event, lines, role }: { event: Event; lines: ScheduleLines; role: GroupRole }) {
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
  const editable = canEditEvent(role, event)
  const onPressFor = (line: ItemLine) =>
    hasActions(itemActions(role, event, line.state)) ? setChosen : undefined

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
                <ItemRow key={line.id} line={line} onPress={onPressFor(line)} general />
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
                <ItemRow key={line.id} line={line} onPress={onPressFor(line)} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {chosen && (
        <ItemActions event={event} role={role} line={chosen} onClose={() => setChosen(null)} />
      )}
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

/**
 * One item: its local time (or "a definir"), the dot, and the card with the name, its state's
 * badge and who sees it when a chosen list, and the place.
 */
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
  const cancelled = line.state === 'CANCELLED'
  const when = general ? '' : (line.time ?? 'a definir')
  const mark = ITEM_STATE_MARKS[line.state]
  const audience = audienceMark(line.item)
  const label = [when, line.name, line.detail, mark?.spoken, audience?.spoken]
    .filter(Boolean)
    .join(', ')
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
            { color: untimed || cancelled ? colors.textMuted : colors.text },
          ]}
        >
          {when}
        </Text>
      )}
      <View
        style={[
          styles.dot,
          cancelled
            ? { borderColor: colors.border, backgroundColor: colors.divider }
            : untimed
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
          cancelled
            ? { backgroundColor: colors.divider }
            : untimed && !general
              ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border }
              : { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.cardTop}>
          <Text
            style={[
              styles.itemName,
              { color: cancelled ? colors.textMuted : colors.text },
              cancelled && styles.struck,
            ]}
          >
            {line.name}
          </Text>
          {(mark || audience) && (
            <View style={styles.badges}>
              {mark && <Badge label={mark.badge} tone={mark.tone} />}
              {audience && <Badge label={audience.badge} tone={audience.tone} />}
            </View>
          )}
        </View>
        {(line.detail || (untimed && !general)) && (
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {line.detail ?? 'horário a confirmar'}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

/**
 * D-AcoesItem by the item's state (`itemActions`), under its last change ("Alterado por Bruno
 * Reis há 2 h"): in Draft, "Editar", "Publicar" and "Apagar" (with a confirmation); published,
 * "Editar" and "Cancelar item"; Cancelled, only "Descancelar".
 */
function ItemActions({
  event,
  role,
  line,
  onClose,
}: {
  event: Event
  role: GroupRole
  line: ItemLine
  onClose: () => void
}) {
  const { colors } = useTheme()
  const router = useRouter()
  const remove = useDeleteItem(event.id)
  const move = useMoveItem(event.id)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const can = itemActions(role, event, line.state)
  const lastChange = lastChangeText(line.item, new Date())

  const run = async (write: () => Promise<unknown>, fallback: string) => {
    setError(null)
    try {
      await write()
      onClose()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : fallback)
    }
  }
  const moveTo = (to: ItemMove) =>
    run(() => move.mutateAsync({ itemId: line.id, move: to }), 'Não foi possível salvar.')
  const errorText = error && (
    <Text style={[textStyles.body, { color: palette.red[700] }]}>{error}</Text>
  )

  if (confirming) {
    return (
      <Sheet visible title={`Apagar ${line.name}?`} onClose={onClose}>
        <Text style={[textStyles.body, { color: colors.textMuted }]}>
          O item sai da programação e não dá para desfazer.
        </Text>
        {errorText}
        <Button
          label="Apagar"
          variant="danger"
          loading={remove.isPending}
          onPress={() => run(() => remove.mutateAsync(line.id), 'Não foi possível apagar.')}
        />
        <Button label="Voltar" variant="link" onPress={() => setConfirming(false)} />
      </Sheet>
    )
  }
  const pending = (to: ItemMove) => move.isPending && move.variables?.move === to
  return (
    <Sheet visible title={line.name} onClose={onClose}>
      {line.detail && (
        <Text style={[textStyles.body, { color: colors.textMuted }]}>{line.detail}</Text>
      )}
      {line.state === 'DRAFT' && <Badge label={DRAFT_BADGE} tone="gold" />}
      {line.state === 'CANCELLED' && <Badge label="CANCELADO" tone="red" />}
      <ItemContent fields={line.item.fields} />
      {lastChange && (
        <Text
          style={[
            textStyles.caption,
            styles.lastChange,
            { color: colors.textMuted, backgroundColor: colors.bg },
          ]}
        >
          {lastChange}
        </Text>
      )}
      {errorText}
      {can.edit && (
        <Button
          label="Editar"
          variant="secondary"
          onPress={() => {
            onClose()
            router.push(`/events/${event.id}/items/${line.id}`)
          }}
        />
      )}
      {can.publish && (
        <Button label="Publicar" loading={pending('publish')} onPress={() => moveTo('publish')} />
      )}
      {can.cancel && (
        <Button
          label="Cancelar item"
          variant="danger"
          loading={pending('cancel')}
          onPress={() => moveTo('cancel')}
        />
      )}
      {can.uncancel && (
        <Button
          label="Descancelar"
          loading={pending('uncancel')}
          onPress={() => moveTo('uncancel')}
        />
      )}
      {can.delete && <Button label="Apagar" variant="danger" onPress={() => setConfirming(true)} />}
      <Text style={[textStyles.caption, { color: colors.textMuted }]}>
        {line.state === 'DRAFT'
          ? 'Em rascunho, só os Owners veem o item até publicar.'
          : 'Cancelado, o item fica visível com o selo e não muda até descancelar.'}
      </Text>
    </Sheet>
  )
}

/**
 * What the item holds, so the Owner sees it before choosing an action: each Field in order, a text
 * one with its value, one of people with their names (and Personal notes, the Owner sees them all).
 * Long content scrolls inside the sheet; an item with no Fields says so.
 */
function ItemContent({ fields }: { fields: ItemField[] }) {
  const { colors } = useTheme()
  if (fields.length === 0) {
    return <Text style={[textStyles.body, { color: colors.textMuted }]}>Sem conteúdo ainda.</Text>
  }
  return (
    <ScrollView
      style={[styles.content, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.contentInner}
    >
      {fields.map((field) => (
        <View key={field.id} style={styles.field}>
          <Text style={[styles.fieldName, { color: colors.textMuted }]}>{field.name}</Text>
          {field.type === 'TEXT' ? (
            <Text selectable style={[textStyles.body, { color: colors.text }]}>
              {field.value}
            </Text>
          ) : field.people.length === 0 ? (
            <Text style={[textStyles.body, { color: colors.textMuted }]}>Ninguém ainda.</Text>
          ) : (
            field.people.map((person, index) => (
              <Text key={`${person.userId ?? person.name}-${index}`} style={textStyles.body}>
                <Text style={{ color: colors.text }}>{person.name}</Text>
                {person.personalNote ? (
                  <Text style={{ color: colors.textMuted }}> · {person.personalNote}</Text>
                ) : null}
              </Text>
            ))
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { maxHeight: 280, borderRadius: 14 },
  contentInner: { padding: 12, gap: 12 },
  field: { gap: 2 },
  fieldName: { fontFamily: fonts.sans600, fontSize: 12, textTransform: 'uppercase' },
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
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 },
  lastChange: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, overflow: 'hidden' },
  itemName: { flexShrink: 1, fontFamily: fonts.sans600, fontSize: 15 },
  struck: { textDecorationLine: 'line-through' },
  detail: { fontFamily: fonts.sans400, fontSize: 12 },
})
