import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge, Button, ErrorState, Icon, ListSkeleton, Sheet } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { initials } from '@/shared/domain/initials'
import { dayHeading, dayLabel } from '@/shared/domain/local-dates'
import { whatsappUrl } from '@/shared/domain/phone'
import { timezoneCity } from '@/shared/domain/timezones'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { Event, EventItem, Participant } from '../api'
import { useEvent } from '../hooks/use-event'
import { participantsAvailable, useParticipants } from '../hooks/use-participants'
import { useSchedule } from '../hooks/use-schedule'
import { lastChangeText } from '../item-state'
import {
  personalItem,
  type ShownPeopleField,
  type ShownPerson,
  type PersonalItem,
} from '../personal-schedule'
import { scheduleItems } from '../schedule-lines'

/**
 * An Event item as whoever it reaches reads it (D-Item, stories 38–40, 43–45): the name, the day,
 * the local time and its zone; then every Field in the production's order, a Field of people only
 * the viewer's own, the others behind "Ver todos" (the other cars); each person with the Personal
 * note the viewer may see ("Sua nota · só você e a produção"), a loose name marked "SEM LOGIN",
 * someone who left marked "fora do Event", and a tap on a Participant's phone opening WhatsApp.
 * Under it, who changed it last.
 */
export function ItemScreen({ eventId, itemId }: { eventId: number; itemId: number }) {
  const { colors } = useTheme()
  const user = useSession((state) => state.session?.user)
  const event = useEvent(eventId)
  const schedule = useSchedule(eventId)
  const participants = useParticipants(eventId, { enabled: participantsAvailable() })
  const item = schedule.data && scheduleItems(schedule.data).find((i) => i.id === itemId)

  if (event.data && item && user) {
    return (
      <Item
        event={event.data}
        item={item}
        shown={personalItem(item, user.id)}
        participants={participants.data ?? []}
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
      ) : schedule.data ? (
        <Text style={[textStyles.body, { color: colors.textMuted }]}>
          Este item não está mais na sua programação.
        </Text>
      ) : (
        <ListSkeleton />
      )}
    </View>
  )
}

function Item({
  event,
  item,
  shown,
  participants,
}: {
  event: Event
  item: EventItem
  shown: PersonalItem
  participants: Participant[]
}) {
  const theme = useTheme()
  const { colors } = theme
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [allOpen, setAllOpen] = useState(false)
  const tone = autoTone(event.id)
  const [from, to] = theme.cover(tone)
  const cancelled = item.state === 'CANCELLED'
  const lastChange = lastChangeText(item, new Date())
  const phoneOf = (userId: number | null) =>
    participants.find((p) => p.userId === userId)?.phone ?? null
  const where = [item.place?.name, item.place?.address].filter(Boolean).join(' · ')
  const peopleFields = shown.fields.filter((f) => f.kind === 'PEOPLE').length + shown.others.length

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.cover,
            {
              height: insets.top + 140,
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
            <Text numberOfLines={1} style={[styles.eventName, { color: palette[tone][50] }]}>
              {event.name}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                boxShadow: `0 18px 32px -18px ${palette[tone][900]}80`,
              },
            ]}
          >
            {cancelled && <Badge label="CANCELADO" tone="red" />}
            <Text
              accessibilityRole="header"
              style={[styles.name, { color: colors.text }, cancelled && styles.struck]}
            >
              {item.name}
            </Text>
            {item.when && (
              <View style={[styles.when, { borderColor: colors.divider }]}>
                <View style={[styles.whenCell, { borderColor: colors.divider }, styles.whenFirst]}>
                  <Text style={[styles.whenValue, { color: palette[tone][700] }]}>
                    {dayHeading(item.when.date)}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.textMuted }]}>
                    {dayLabel(item.when.date)}
                  </Text>
                </View>
                <View style={styles.whenCell}>
                  <Text style={[styles.whenValue, { color: palette[tone][700] }]}>
                    {item.when.time ?? 'a definir'}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.textMuted }]}>
                    {`horário de ${timezoneCity(item.when.timezone)}`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {peopleFields > 0 && (
            <View style={[styles.box, styles.yours, { backgroundColor: colors.surface }]}>
              <View style={styles.yoursText}>
                <Text style={[styles.strong, { color: colors.text }]}>
                  {shown.yours.length > 0 ? shown.yours.join(' · ') : 'Você não está em nenhum'}
                </Text>
                <Text style={[textStyles.caption, { color: colors.textMuted }]}>
                  {peopleFields === 1 ? '1 grupo neste item' : `${peopleFields} grupos neste item`}
                </Text>
              </View>
              {shown.others.length > 0 && (
                <Pressable
                  onPress={() => setAllOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos"
                  style={[styles.seeAll, { backgroundColor: colors.action }]}
                >
                  <Text style={[styles.seeAllLabel, { color: colors.onAction }]}>Ver todos</Text>
                </Pressable>
              )}
            </View>
          )}

          {shown.fields.map((field) =>
            field.kind === 'PEOPLE' ? (
              <PeopleBox key={field.id} field={field} phoneOf={phoneOf} />
            ) : (
              <View key={field.id} style={[styles.box, { backgroundColor: colors.surface }]}>
                <Text style={[textStyles.caption, { color: colors.textMuted }]}>{field.name}</Text>
                <Text style={[styles.strong, { color: colors.text }]}>{field.value}</Text>
              </View>
            ),
          )}

          {where !== '' && (
            <View style={[styles.box, { backgroundColor: colors.surface }]}>
              <Text style={[textStyles.caption, { color: colors.textMuted }]}>Local</Text>
              <Text style={[styles.strong, { color: colors.text }]}>{where}</Text>
            </View>
          )}

          {lastChange && (
            <Text style={[textStyles.caption, { color: colors.textMuted }]}>{lastChange}</Text>
          )}
        </View>
      </ScrollView>

      {allOpen && (
        <Sheet visible title="Ver todos" onClose={() => setAllOpen(false)}>
          {[...shown.fields.filter((f) => f.kind === 'PEOPLE'), ...shown.others].map((field) => (
            <PeopleBox key={field.id} field={field} phoneOf={phoneOf} />
          ))}
          <Button label="Fechar" variant="link" onPress={() => setAllOpen(false)} />
        </Sheet>
      )}
    </View>
  )
}

/** A Field of people: its name, then each person in the production's order. */
function PeopleBox({
  field,
  phoneOf,
}: {
  field: ShownPeopleField
  phoneOf: (userId: number | null) => string | null
}) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        styles.box,
        styles.people,
        { backgroundColor: colors.surface },
        field.isYours && { borderWidth: 1.5, borderColor: colors.action },
      ]}
    >
      <View style={styles.peopleTop}>
        <Text accessibilityRole="header" style={[styles.fieldName, { color: colors.textMuted }]}>
          {field.name.toUpperCase()}
        </Text>
        {field.isYours && <Badge label="VOCÊ ESTÁ AQUI" tone="blue" />}
      </View>
      {field.people.map((person, i) => (
        <PersonRow
          key={`${person.userId ?? person.name}-${i}`}
          person={person}
          phone={person.isYou ? null : phoneOf(person.userId)}
        />
      ))}
    </View>
  )
}

function PersonRow({ person, phone }: { person: ShownPerson; phone: string | null }) {
  const { colors, badge } = useTheme()
  const url = phone && !person.outOfEvent ? whatsappUrl(phone) : null
  const contact = badge('blue')
  const subtitle = person.outOfEvent ? 'fora do Event' : person.noteLabel ? null : person.note
  return (
    <View style={[styles.person, person.outOfEvent && styles.faded]}>
      <View style={[styles.avatar, { backgroundColor: colors.divider }]}>
        <Text style={[styles.initials, { color: colors.text }]}>{initials(person.name)}</Text>
      </View>
      <View style={styles.personText}>
        <Text
          style={[
            person.isYou ? styles.you : styles.personName,
            { color: colors.text },
            person.outOfEvent && styles.struck,
          ]}
        >
          {person.name}
        </Text>
        {subtitle && (
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
        {person.noteLabel && (
          <>
            <Text style={[textStyles.caption, { color: colors.textMuted }]}>
              {person.noteLabel}
            </Text>
            <Text style={[styles.strong, { color: colors.text }]}>{person.note}</Text>
          </>
        )}
      </View>
      {person.loose && <Badge label="SEM LOGIN" tone="gray" />}
      {url && (
        <Pressable
          onPress={() => Linking.openURL(url)}
          accessibilityRole="link"
          accessibilityLabel={`Abrir WhatsApp de ${person.name}`}
          style={[styles.whatsapp, { backgroundColor: contact.bg }]}
        >
          <Icon name="phone" color={contact.text} size={18} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { padding: 20, paddingTop: 80 },
  scroll: { paddingBottom: 40 },
  cover: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  coverBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 13 },
  body: { marginTop: -70, paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 24, padding: 16, gap: 10 },
  name: { fontFamily: fonts.sans700, fontSize: 26, lineHeight: 29 },
  struck: { textDecorationLine: 'line-through' },
  when: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row' },
  whenCell: { flex: 1, paddingLeft: 14 },
  whenFirst: { paddingLeft: 0, borderRightWidth: 1 },
  whenValue: { fontFamily: fonts.sans700, fontSize: 15 },
  box: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  yours: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yoursText: { flex: 1 },
  strong: { fontFamily: fonts.sans600, fontSize: 15 },
  seeAll: {
    height: spacing.touchTarget,
    paddingHorizontal: 16,
    borderRadius: spacing.touchTarget / 2,
    justifyContent: 'center',
  },
  seeAllLabel: { fontFamily: fonts.sans600, fontSize: 14 },
  people: { gap: 10 },
  peopleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldName: { fontFamily: fonts.sans700, fontSize: 12, letterSpacing: 0.5 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: spacing.touchTarget },
  faded: { opacity: 0.55 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.sans700, fontSize: 13 },
  personText: { flex: 1 },
  personName: { fontFamily: fonts.sans600, fontSize: 15 },
  you: { fontFamily: fonts.sans700, fontSize: 15 },
  whatsapp: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
