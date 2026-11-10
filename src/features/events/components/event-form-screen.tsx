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
  Sheet,
  TextField,
} from '@/shared/components/ui'
import { autoTone, type AutoTone } from '@/shared/domain/auto-tone'
import { canEditEvent, roleIn } from '@/shared/domain/group-role'
import { dateFromTyping, deviceToday, typingDate, weekday } from '@/shared/domain/local-dates'
import { TIMEZONE_CHOICES, timezoneLabel } from '@/shared/domain/timezones'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event } from '../api'
import {
  errorsFromApi,
  eventFormInput,
  initialEventForm,
  type EventForm,
  type EventFormErrors,
} from '../event-form'
import { useEvent } from '../hooks/use-event'
import { useCreateEvent, useUpdateEvent } from '../hooks/use-save-event'

/** A new Event has no id yet, so no tone: the header previews one, labelled "cor automática". */
const NEW_EVENT_TONE: AutoTone = 'purple'

/** "Novo Event" (D-NovoEvent, PROJ-217): the Owner creates it in the Group, born in Draft. */
export function NewEventScreen({ groupId }: { groupId: number }) {
  const router = useRouter()
  const create = useCreateEvent(groupId)
  const groupName = useSession(
    (state) => state.session?.user.memberships.find((m) => m.groupId === groupId)?.groupName,
  )

  return (
    <EventFormView
      tone={NEW_EVENT_TONE}
      title={['Novo Event', groupName].filter(Boolean).join(' · ')}
      saving={create.isPending}
      check={(form) => eventFormInput(form)}
      send={create.mutateAsync}
      onSaved={(event) => event && router.replace(`/events/${event.id}`)}
    />
  )
}

/**
 * Editing an Event's name, place, timezone and dates (PROJ-217), a Finished event's too. Someone
 * who cannot edit it (a Viewer, or a Cancelled Event) is told so instead of a form.
 */
export function EditEventScreen({ eventId }: { eventId: number }) {
  const event = useEvent(eventId)
  const user = useSession((state) => state.session?.user)
  const { colors } = useTheme()

  if (event.data && user && canEditEvent(roleIn(user, event.data.groupId), event.data)) {
    return <EditEvent event={event.data} />
  }
  return (
    <View style={[styles.screen, styles.padded, { backgroundColor: colors.bg }]}>
      {event.data ? (
        <Notice message="Você não pode editar este Event." alert={false} />
      ) : event.error ? (
        <ErrorState message={event.error.message} onRetry={() => event.refetch()} />
      ) : (
        <ListSkeleton />
      )}
    </View>
  )
}

function EditEvent({ event }: { event: Event }) {
  const router = useRouter()
  const update = useUpdateEvent(event.id)

  return (
    <EventFormView
      event={event}
      tone={autoTone(event.id)}
      title={`Editar · ${event.name}`}
      saving={update.isPending}
      check={(form) => eventFormInput(form, event)}
      send={update.mutateAsync}
      onSaved={() => router.back()}
    />
  )
}

type EventFormViewProps<Input> = {
  /** The Event being edited; none when creating. */
  event?: Event
  tone: AutoTone
  /** Above the name: "Novo Event · Vocal Livre", "Editar · Saída Manaus". */
  title: string
  saving: boolean
  /** The form's own check: errors on the fields, and what to send (null when nothing changed). */
  check: (form: EventForm) => { errors: EventFormErrors; input: Input | null }
  send: (input: Input) => Promise<Event>
  /** After the save, or at once when there was nothing to send. */
  onSaved: (event?: Event) => void
}

/**
 * The fields of D-NovoEvent: the name on the cover in the Event's color, then where (city or
 * venue, and the items' default timezone) and when (the dates only, typed `DD/MM/AAAA`).
 */
function EventFormView<Input>({
  event,
  tone,
  title,
  saving,
  check,
  send,
  onSaved,
}: EventFormViewProps<Input>) {
  const theme = useTheme()
  const { colors } = theme
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [form, setForm] = useState<EventForm>(() => initialEventForm(event))
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [picking, setPicking] = useState(false)
  const [from, to] = theme.cover(tone)

  const edit = (key: keyof EventForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }))
  }
  const save = async () => {
    const checked = check(form)
    setErrors(checked.errors)
    if (Object.keys(checked.errors).length > 0) return
    if (!checked.input) return onSaved()
    try {
      onSaved(await send(checked.input))
    } catch (error) {
      setErrors(errorsFromApi(error))
    }
  }
  const muted = palette[tone][100]
  const danger = theme.badge('red').text
  // The offset shown is the one on the Event's first day, or today's while there is none.
  const offsetOn = dateFromTyping(form.startDate) ?? deviceToday(new Date())
  const timezone = timezoneLabel(form.timezone, offsetOn)

  const timezones = TIMEZONE_CHOICES.includes(form.timezone as (typeof TIMEZONE_CHOICES)[number])
    ? TIMEZONE_CHOICES
    : [form.timezone, ...TIMEZONE_CHOICES]

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
            {!event && <Text style={[styles.headerNote, { color: muted }]}>cor automática</Text>}
          </View>
          <Text style={[styles.headerNote, { color: muted }]}>{title}</Text>
          <TextInput
            value={form.name}
            onChangeText={edit('name')}
            placeholder="Nome do Event"
            placeholderTextColor={muted}
            accessibilityLabel="Nome do Event"
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
          <Text style={[styles.section, { color: colors.text }]}>Onde</Text>
          <TextField
            label="Cidade ou local"
            value={form.place}
            onChangeText={edit('place')}
            error={errors.place}
            autoCapitalize="words"
          />
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`Fuso padrão dos itens: ${timezone}`}
            style={[
              styles.picker,
              {
                backgroundColor: colors.surface,
                borderColor: errors.timezone ? danger : colors.border,
              },
            ]}
          >
            <View style={styles.pickerText}>
              <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>
                Fuso padrão dos itens
              </Text>
              <Text style={[styles.pickerValue, { color: colors.text }]}>{timezone}</Text>
            </View>
            <Icon name="chevronDown" color={colors.textMuted} size={18} strokeWidth={2} />
          </Pressable>
          {errors.timezone && (
            <Text style={[styles.error, { color: danger }]}>{errors.timezone}</Text>
          )}

          <Text style={[styles.section, styles.when, { color: colors.text }]}>Quando</Text>
          <View style={styles.dates}>
            <View style={styles.date}>
              <TextField
                label="Começa"
                value={form.startDate}
                onChangeText={(text) => edit('startDate')(typingDate(text))}
                error={errors.startDate}
                placeholder="dd/mm/aaaa"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.date}>
              <TextField
                label="Termina"
                value={form.endDate}
                onChangeText={(text) => edit('endDate')(typingDate(text))}
                error={errors.endDate}
                placeholder="dd/mm/aaaa"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>
            {daysHint(form) ?? 'Só as datas. As horas ficam nos itens.'}
          </Text>

          {!event && (
            <View style={[styles.draft, { backgroundColor: theme.badge('gold').bg }]}>
              <Badge label="RASCUNHO" tone="gold" />
              <Text style={[styles.draftText, { color: colors.text }]}>
                O Event nasce em rascunho: o Group já vê onde e quando, mas nenhum item até você
                publicar.
              </Text>
            </View>
          )}
          {errors.form && <Notice message={errors.form} />}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label={event ? 'Salvar' : 'Criar Event'} loading={saving} onPress={save} />
      </View>

      <Sheet visible={picking} title="Fuso padrão" onClose={() => setPicking(false)}>
        <ScrollView style={styles.choices} contentContainerStyle={styles.choicesList}>
          {timezones.map((choice) => {
            const selected = choice === form.timezone
            return (
              <Pressable
                key={choice}
                onPress={() => {
                  edit('timezone')(choice)
                  setPicking(false)
                }}
                accessibilityRole="button"
                accessibilityLabel={timezoneLabel(choice, offsetOn)}
                accessibilityState={{ selected }}
                style={[
                  styles.choice,
                  selected && { backgroundColor: colors.surfaceBrand, borderColor: colors.action },
                ]}
              >
                <Text style={[textStyles.body, { color: colors.text }]}>
                  {timezoneLabel(choice, offsetOn)}
                </Text>
                {selected && <Icon name="check" color={colors.action} size={20} />}
              </Pressable>
            )
          })}
        </ScrollView>
      </Sheet>
    </KeyboardAvoidingView>
  )
}

/** "sex. a dom." under the dates once both read as dates, so a typo in the day shows at once. */
function daysHint(form: EventForm): string | null {
  const start = dateFromTyping(form.startDate)
  const end = dateFromTyping(form.endDate)
  if (!start || !end || end < start) return null
  const days = start === end ? weekday(start) : `${weekday(start)} a ${weekday(end)}`
  return `${days} · Só as datas. As horas ficam nos itens.`
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
  cancel: { minWidth: 72, height: spacing.touchTarget, justifyContent: 'center' },
  cancelLabel: { fontFamily: fonts.sans400, fontSize: 15, color: '#FFFFFF' },
  headerNote: { fontFamily: fonts.sans400, fontSize: 13 },
  nameInput: {
    fontFamily: fonts.sans700,
    fontSize: 30,
    lineHeight: 36,
    color: '#FFFFFF',
    padding: 0,
  },
  headerError: { fontFamily: fonts.sans600, fontSize: 13, color: palette.red[100] },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  section: { fontFamily: fonts.sans700, fontSize: 16 },
  when: { marginTop: 4 },
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
  dates: { flexDirection: 'row', gap: 10 },
  date: { flex: 1 },
  draft: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, alignItems: 'flex-start' },
  draftText: { flex: 1, fontFamily: fonts.sans400, fontSize: 13, lineHeight: 19 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  choices: { maxHeight: 420 },
  choicesList: { gap: 6 },
  choice: {
    minHeight: spacing.touchTarget + 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
