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

import {
  Badge,
  Button,
  ErrorState,
  Icon,
  ListSkeleton,
  Notice,
  TextField,
} from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, roleIn, writesEvents } from '@/shared/domain/group-role'
import { dateFromTyping, typingTime } from '@/shared/domain/local-dates'
import { TIMEZONE_CHOICES, timezoneCity, timezoneLabel } from '@/shared/domain/timezones'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event, EventItem, EventItemChanges, EventItemInput } from '../api'
import { useEvent } from '../hooks/use-event'
import {
  audienceAvailable,
  peopleFieldsAvailable,
  useCreateItem,
  useUpdateItem,
  type ItemSave,
  type SaveAction,
} from '../hooks/use-item-writes'
import { participantsAvailable, useGroupTeams, useParticipants } from '../hooks/use-participants'
import { useSchedule } from '../hooks/use-schedule'
import {
  addLooseName,
  addParticipant,
  addPeopleField,
  addTextField,
  audienceReach,
  draftTimezone,
  editField,
  editPersonalNote,
  errorsFromApi,
  fieldErrorKey,
  fieldWrites,
  hasFieldWrites,
  initialItemDraft,
  itemDraftInput,
  moveField,
  removeField,
  removePerson,
  setNotesVisibility,
  toggleHighlight,
  type AudienceDraft,
  type FieldTextChanges,
  type ItemDraft,
  type ItemDraftErrors,
} from '../item-draft'
import { scheduleItems } from '../schedule-lines'
import { DRAFT_BADGE } from '../item-state'
import { plural } from '@/shared/domain/plural'
import { AudienceSheet } from './audience-sheet'
import { DateField } from './date-field'
import { ItemFields } from './item-fields'
import { TimezoneSheet } from './timezone-sheet'

/**
 * "+ Item" (D-Editar, PROJ-220, PROJ-226): the Owner creates an Event item, born published in a
 * Draft Event and in Draft in a published one, where it is saved as is or published at once.
 */
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
        item?.state === 'CANCELLED' ? (
          <Waiting
            refused="Este item está cancelado. Descancele para editar."
            onRetry={() => schedule.refetch()}
          />
        ) : item ? (
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
 * The editor only for someone who writes the Event's items; anyone else is told so, and so is the
 * Owner of a Cancelled Event, frozen.
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
  if (event.data && role && canEditEvent(role, event.data)) return children(event.data)
  const refused = !event.data
    ? null
    : role && event.data.cancelled && writesEvents(role)
      ? 'O Event está cancelado. Descancele para editar os itens.'
      : 'Você não pode editar os itens deste Event.'
  return <Waiting error={event.error} refused={refused} onRetry={() => event.refetch()} />
}

function Waiting({
  error,
  refused = null,
  gone = false,
  onRetry,
}: {
  error?: Error | null
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
  const bornInDraft = event.state === 'PUBLISHED'
  return (
    <ItemEditorView
      event={event}
      title={`Novo item · ${event.name}`}
      saveLabel={bornInDraft ? 'Salvar' : 'Criar item'}
      inDraft={bornInDraft}
      saving={create.isPending}
      check={(draft) => itemDraftInput(draft)}
      send={({ input, ...save }) => (input ? create.mutateAsync({ input, ...save }) : null)}
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
      inDraft={item.state === 'DRAFT'}
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
  /** An item in Draft (or born in Draft): "RASCUNHO" on the cover, and "Publicar" by "Salvar". */
  inDraft: boolean
  saving: boolean
  check: (draft: ItemDraft) => { errors: ItemDraftErrors; input: Input | null }
  /** The item's payload (`null`: nothing of it changed), its Fields' writes, and the action. */
  send: (save: ItemSave<Input | null>) => Promise<unknown> | null
  onSaved: () => void
}

/**
 * The fields of D-Editar: the name on the cover in the Event's color, then when (the day and the
 * local time, both optional, the time only with a day) and where (name, address and the place's
 * own timezone, or the Event's), then the text Fields (PROJ-223) and the Fields of people
 * (PROJ-225), and "Quem vê", the Audience (PROJ-233). An item in Draft is saved as it is or
 * published with what changed (PROJ-226).
 */
function ItemEditorView<Input extends EventItemInput | EventItemChanges>({
  event,
  item,
  title,
  saveLabel,
  inDraft,
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
  const [choosingAudience, setChoosingAudience] = useState(false)
  const [action, setAction] = useState<SaveAction>('save')
  const canAddPeopleFields = peopleFieldsAvailable()
  const canChooseParticipants = canAddPeopleFields && participantsAvailable()
  const canChooseAudience = audienceAvailable() && participantsAvailable()
  const participants = useParticipants(event.id, {
    enabled: canChooseParticipants || canChooseAudience,
  })
  const teams = useGroupTeams(event.groupId, { enabled: canChooseAudience })
  const participantChoices = participants.data?.map(({ userId, name }) => ({ userId, name }))
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
  const editFields = (change: (draft: ItemDraft) => ItemDraft, key?: string) => {
    setDraft(change)
    if (key)
      setErrors((current) => ({ ...current, [fieldErrorKey(key)]: undefined, form: undefined }))
  }
  const submit = async (chosen: SaveAction) => {
    setAction(chosen)
    const checked = check(draft)
    setErrors(checked.errors)
    if (Object.keys(checked.errors).length > 0) return
    const fields = fieldWrites(draft, item)
    if (!checked.input && !hasFieldWrites(fields) && chosen === 'save') return onSaved()
    try {
      await send({ input: checked.input, fields, action: chosen })
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
          <View style={styles.bar}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={styles.cancel}
            >
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
            {inDraft && <Badge label={DRAFT_BADGE} tone="gold" />}
          </View>
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

          {canChooseAudience && (
            <AudienceRow
              audience={draft.audience}
              reach={
                participants.data &&
                audienceReach(
                  draft.audience,
                  draft.fields,
                  participants.data.map((p) => p.userId),
                )
              }
              error={errors.audience}
              onPress={() => setChoosingAudience(true)}
            />
          )}

          <ItemFields
            fields={draft.fields}
            errors={errors}
            canAddPeopleFields={canAddPeopleFields}
            participants={canChooseParticipants ? participantChoices : null}
            onAdd={() => editFields(addTextField)}
            onAddPeople={() => editFields(addPeopleField)}
            onEdit={(key, changes: FieldTextChanges) =>
              editFields((d) => editField(d, key, changes), key)
            }
            onToggleHighlight={(key) => editFields((d) => toggleHighlight(d, key))}
            onMove={(key, by) => editFields((d) => moveField(d, key, by))}
            onRemove={(key) => editFields((d) => removeField(d, key), key)}
            peopleActions={{
              onAddParticipant: (key, person) =>
                editFields((d) => addParticipant(d, key, person), key),
              onAddLooseName: (key, name) => editFields((d) => addLooseName(d, key, name), key),
              onRemovePerson: (key, personKey) =>
                editFields((d) => removePerson(d, key, personKey), key),
              onEditNote: (key, personKey, note) =>
                editFields((d) => editPersonalNote(d, key, personKey, note), key),
              onVisibility: (key, visibility) =>
                editFields((d) => setNotesVisibility(d, key, visibility), key),
            }}
          />
          {errors.form && <Notice message={errors.form} />}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button
          label={saveLabel}
          variant={inDraft ? 'secondary' : 'primary'}
          loading={saving && action === 'save'}
          disabled={saving}
          onPress={() => submit('save')}
          style={styles.footerButton}
        />
        {inDraft && (
          <Button
            label="Publicar"
            loading={saving && action === 'saveAndPublish'}
            disabled={saving}
            onPress={() => submit('saveAndPublish')}
            style={styles.publish}
          />
        )}
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
      {canChooseAudience && participantChoices && (
        <AudienceSheet
          visible={choosingAudience}
          itemName={draft.name}
          audience={draft.audience}
          fields={draft.fields}
          participants={participantChoices}
          teams={teams.data ?? []}
          onApply={(audience) => {
            edit('audience')(audience)
            setChoosingAudience(false)
          }}
          onClose={() => setChoosingAudience(false)}
        />
      )}
    </KeyboardAvoidingView>
  )
}

/**
 * "Quem vê" in the editor: "Todos que vão" or "Lista escolhida" and how many it reaches (once the
 * Participants are read), opening the sheet where it is chosen.
 */
function AudienceRow({
  audience,
  reach,
  error,
  onPress,
}: {
  audience: AudienceDraft
  reach: number | undefined
  error?: string
  onPress: () => void
}) {
  const theme = useTheme()
  const { colors } = theme
  const danger = theme.badge('red').text
  const kind = audience.kind === 'ALL' ? 'Todos que vão' : 'Lista escolhida'
  const count = reach === undefined ? null : plural(reach, 'pessoa', 'pessoas')
  return (
    <>
      <Text style={[styles.section, styles.where, { color: colors.text }]}>Quem vê</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={['Quem vê', [kind, count].filter(Boolean).join(', ')].join(': ')}
        style={[
          styles.picker,
          { backgroundColor: colors.surface, borderColor: error ? danger : colors.border },
        ]}
      >
        <View style={styles.pickerText}>
          <Text style={[styles.pickerValue, { color: colors.text }]}>{kind}</Text>
          {count && <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>{count}</Text>}
        </View>
        <Icon name="chevronDown" color={colors.textMuted} size={18} strokeWidth={2} />
      </Pressable>
      {error && (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: danger }]}>
          {error}
        </Text>
      )}
    </>
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
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancel: {
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
  footer: { paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', gap: 10 },
  footerButton: { flex: 1 },
  publish: { flex: 1.4 },
})
