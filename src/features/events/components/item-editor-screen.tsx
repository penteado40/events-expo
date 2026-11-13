import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, ErrorState, Icon, ListSkeleton, Notice, TextField } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, canWriteItems, roleIn } from '@/shared/domain/group-role'
import { dateFromTyping, typingTime } from '@/shared/domain/local-dates'
import { TIMEZONE_CHOICES, timezoneCity, timezoneLabel } from '@/shared/domain/timezones'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event, EventItem, EventItemChanges, EventItemInput } from '../api'
import { useEvent } from '../hooks/use-event'
import { useCreateItem, useUpdateItem } from '../hooks/use-item-writes'
import { useSchedule } from '../hooks/use-schedule'
import {
  draftTimezone,
  errorsFromApi,
  initialItemDraft,
  itemDraftInput,
  type ItemDraft,
  type ItemDraftErrors,
} from '../item-draft'
import { scheduleItems } from '../schedule-lines'
import { DateField } from './date-field'
import { TimezoneSheet } from './timezone-sheet'

/** "+ Item" (D-Editar, PROJ-220): the Owner creates an Event item, born published in a Draft Event. */
export function NewItemScreen({ eventId }: { eventId: number }) {
  return <EditableEvent eventId={eventId}>{(event) => <NewItem event={event} />}</EditableEvent>
}

/** Editing an Event item's name, date, time and place, found in the schedule already read. */
export function EditItemScreen({ eventId, itemId }: { eventId: number; itemId: number }) {
  const schedule = useSchedule(eventId)
  const item = schedule.data && scheduleItems(schedule.data).find((i) => i.id === itemId)
  return (
    <EditableEvent eventId={eventId}>
      {(event) =>
        item ? (
          <EditItem event={event} item={item} />
        ) : (
          <Waiting
            error={schedule.error}
            gone={!!schedule.data}
            onRetry={() => schedule.refetch()}
          />
        )
      }
    </EditableEvent>
  )
}

/**
 * The editor only for someone who writes the Event's items, for now only in an Event in Draft;
 * anyone else is told so, and so is the Owner of a published Event.
 */
function EditableEvent({
  eventId,
  children,
}: {
  eventId: number
  children: (event: Event) => React.ReactNode
}) {
  const event = useEvent(eventId)
  const user = useSession((state) => state.session?.user)
  const role = event.data && user ? roleIn(user, event.data.groupId) : null
  if (event.data && role && canWriteItems(role, event.data)) return children(event.data)
  const refused = !event.data
    ? null
    : role && canEditEvent(role, event.data)
      ? 'Os itens de um Event publicado ainda não podem ser editados.'
      : 'Você não pode editar os itens deste Event.'
  return <Waiting error={event.error} refused={refused} onRetry={() => event.refetch()} />
}

function Waiting({
  error,
  refused = null,
  gone = false,
  onRetry,
}: {
  error: Error | null
  /** Why the editor is not open, when it is not. */
  refused?: string | null
  gone?: boolean
  onRetry: () => void
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.screen, styles.padded, { backgroundColor: colors.bg }]}>
      {refused ? (
        <Notice message={refused} alert={false} />
      ) : gone ? (
        <Notice message="Este item não existe mais." alert={false} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={onRetry} />
      ) : (
        <ListSkeleton />
      )}
    </View>
  )
}

function NewItem({ event }: { event: Event }) {
  const router = useRouter()
  const create = useCreateItem(event.id)
  return (
    <ItemEditorView
      event={event}
      title={`Novo item · ${event.name}`}
      saveLabel="Criar item"
      saving={create.isPending}
      check={(draft) => itemDraftInput(draft)}
      send={create.mutateAsync}
      onSaved={() => router.back()}
    />
  )
}

function EditItem({ event, item }: { event: Event; item: EventItem }) {
  const router = useRouter()
  const update = useUpdateItem(event.id, item.id)
  return (
    <ItemEditorView<EventItemChanges>
      event={event}
      item={item}
      title={`Editar · ${event.name}`}
      saveLabel="Salvar"
      saving={update.isPending}
      check={(draft) => itemDraftInput(draft, item)}
      send={update.mutateAsync}
      onSaved={() => router.back()}
    />
  )
}

type ItemEditorViewProps<Input> = {
  event: Event
  item?: EventItem
  /** Above the name: "Novo item · Saída Manaus". */
  title: string
  saveLabel: string
  saving: boolean
  check: (draft: ItemDraft) => { errors: ItemDraftErrors; input: Input | null }
  send: (input: Input) => Promise<unknown>
  onSaved: () => void
}

/**
 * The fields of D-Editar: the name on the cover in the Event's color, then when (the day and the
 * local time, both optional, the time only with a day) and where (name, address and the place's
 * own timezone, or the Event's). Fields and "Quem vê" come with their own tickets.
 */
function ItemEditorView<Input extends EventItemInput | EventItemChanges>({
  event,
  item,
  title,
  saveLabel,
  saving,
  check,
  send,
  onSaved,
}: ItemEditorViewProps<Input>) {
  const theme = useTheme()
  const { colors } = theme
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [draft, setDraft] = useState<ItemDraft>(() => initialItemDraft(item))
  const [errors, setErrors] = useState<ItemDraftErrors>({})
  const [picking, setPicking] = useState(false)
  const tone = autoTone(event.id)
  const [from, to] = theme.cover(tone)
  const muted = palette[tone][100]
  const danger = theme.badge('red').text

  const edit =
    <K extends keyof ItemDraft>(key: K) =>
    (value: ItemDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }))
      setErrors((current) => ({ ...current, [key]: undefined, form: undefined }))
    }
  const save = async () => {
    const checked = check(draft)
    setErrors(checked.errors)
    if (Object.keys(checked.errors).length > 0) return
    if (!checked.input) return onSaved()
    try {
      await send(checked.input)
      onSaved()
    } catch (error) {
      setErrors(errorsFromApi(error))
    }
  }

  const eventTimezone = event.period.timezone
  // The offsets shown are those of the item's day, or of the Event's first day without one.
  const offsetOn = dateFromTyping(draft.date) ?? event.period.startDate
  const placeTimezoneLabel = (choice: string | null) =>
    choice === null
      ? `Fuso do Event · ${timezoneLabel(eventTimezone, offsetOn)}`
      : timezoneLabel(choice, offsetOn)
  const choices: readonly (string | null)[] = [
    null,
    ...(draft.placeTimezone && !TIMEZONE_CHOICES.some((tz) => tz === draft.placeTimezone)
      ? [draft.placeTimezone]
      : []),
    ...TIMEZONE_CHOICES,
  ]
  const timeLabel = `Hora · ${timezoneCity(draftTimezone(draft, eventTimezone))}`

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            style={styles.cancel}
          >
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
          <Text style={[styles.headerNote, { color: muted }]}>{title}</Text>
          <TextInput
            value={draft.name}
            onChangeText={edit('name')}
            placeholder="Nome do item"
            placeholderTextColor={muted}
            accessibilityLabel="Nome do item"
            autoCapitalize="sentences"
            returnKeyType="next"
            style={styles.nameInput}
          />
          {errors.name && (
            <Text accessibilityLiveRegion="polite" style={styles.headerError}>
              {errors.name}
            </Text>
          )}
        </View>

        <View style={styles.body}>
          <Text style={[styles.section, { color: colors.text }]}>Quando</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <DateField
                label="Dia"
                value={draft.date}
                onChange={edit('date')}
                error={errors.date}
                opensOn={event.period.startDate}
              />
            </View>
            <View style={styles.half}>
              <TextField
                label={timeLabel}
                value={draft.time}
                onChangeText={(text) => edit('time')(typingTime(text))}
                error={errors.time}
                placeholder="hh:mm"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>
            Sem dia, o item fica nas informações gerais. Sem hora, fica &quot;a definir&quot;.
          </Text>

          <Text style={[styles.section, styles.where, { color: colors.text }]}>Onde</Text>
          <TextField
            label="Nome do lugar"
            value={draft.placeName}
            onChangeText={edit('placeName')}
            error={errors.placeName}
            autoCapitalize="words"
          />
          <TextField
            label="Endereço"
            value={draft.placeAddress}
            onChangeText={edit('placeAddress')}
            error={errors.placeAddress}
          />
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`Fuso do lugar: ${placeTimezoneLabel(draft.placeTimezone)}`}
            style={[
              styles.picker,
              {
                backgroundColor: colors.surface,
                borderColor: errors.placeTimezone ? danger : colors.border,
              },
            ]}
          >
            <View style={styles.pickerText}>
              <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Fuso do lugar</Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>
                {placeTimezoneLabel(draft.placeTimezone)}
              </Text>
            </View>
            <Icon name="chevronDown" color={colors.textMuted} size={18} strokeWidth={2} />
          </Pressable>
          {errors.placeTimezone && (
            <Text style={[styles.error, { color: danger }]}>{errors.placeTimezone}</Text>
          )}
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>
            A hora é sempre a do lugar, nunca convertida.
          </Text>
          {errors.form && <Notice message={errors.form} />}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label={saveLabel} loading={saving} onPress={save} />
      </View>

      <TimezoneSheet
        visible={picking}
        title="Fuso do lugar"
        value={draft.placeTimezone}
        choices={choices}
        labelOf={placeTimezoneLabel}
        onChoose={edit('placeTimezone')}
        onClose={() => setPicking(false)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { padding: 20, paddingTop: 80 },
  scroll: { paddingBottom: 24 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  cancel: {
    alignSelf: 'flex-start',
    minWidth: 72,
    height: spacing.touchTarget,
    justifyContent: 'center',
  },
  cancelLabel: { fontFamily: fonts.sans400, fontSize: 15, color: '#FFFFFF' },
  headerNote: { fontFamily: fonts.sans400, fontSize: 13 },
  nameInput: {
    fontFamily: fonts.sans700,
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    padding: 0,
  },
  headerError: { fontFamily: fonts.sans600, fontSize: 13, color: palette.red[100] },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  section: { fontFamily: fonts.sans700, fontSize: 16 },
  where: { marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  picker: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerText: { flex: 1, gap: 2 },
  pickerLabel: { fontFamily: fonts.sans600, fontSize: 12 },
  pickerValue: { fontFamily: fonts.sans400, fontSize: 16 },
  error: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
})
