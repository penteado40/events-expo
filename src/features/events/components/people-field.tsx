import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { Badge, Icon, Sheet, TextField } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { initials } from '@/shared/domain/initials'
import { fonts, spacing, textStyles, useTheme } from '@/shared/theme'

import type { PersonalNotesVisibility } from '../api'
import type { PeopleFieldDraft, PersonChoice, PersonDraft } from '../item-draft'

type Props = {
  field: PeopleFieldDraft
  /**
   * The Event's Participants to choose from, or `null` where there are none to read (over the
   * events-api for now): then only loose names are added.
   */
  participants: PersonChoice[] | null
  onRename: (name: string) => void
  onAddParticipant: (person: PersonChoice) => void
  onAddLooseName: (name: string) => void
  onRemovePerson: (personKey: string) => void
  onEditNote: (personKey: string, note: string) => void
  onVisibility: (visibility: PersonalNotesVisibility) => void
}

const VISIBILITIES: { value: PersonalNotesVisibility; label: string }[] = [
  { value: 'PRIVATE', label: 'Cada um a sua' },
  { value: 'ALL', label: 'Todos no item' },
]

/**
 * A Field of people in D-Editar (D-FieldPessoas, PROJ-225): its name, its people in order, each
 * with a Personal note, Participants and loose names added ("+ Participant", "+ Nome solto") and
 * taken out, who left the Event marked "fora do Event", and who sees the notes.
 */
export function PeopleField({
  field,
  participants,
  onRename,
  onAddParticipant,
  onAddLooseName,
  onRemovePerson,
  onEditNote,
  onVisibility,
}: Props) {
  const { colors } = useTheme()
  const [choosing, setChoosing] = useState(false)
  const [looseName, setLooseName] = useState<string | null>(null)
  const label = field.name.trim() || 'Field sem nome'
  const choices = (participants ?? []).filter(
    (p) => !field.people.some((person) => person.userId === p.userId),
  )
  const addLooseName = () => {
    if (looseName?.trim()) onAddLooseName(looseName)
    setLooseName(null)
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.kind, { color: colors.textMuted }]}>FIELD DE PESSOAS</Text>
      <TextField
        label="Nome do Field"
        value={field.name}
        onChangeText={onRename}
        placeholder="Carro 1, Quarto 101…"
        autoCapitalize="sentences"
      />
      {field.people.length > 0 && (
        <View style={[styles.people, { borderColor: colors.divider }]}>
          {field.people.map((person, index) => (
            <PersonRow
              key={person.key}
              person={person}
              first={index === 0}
              onRemove={() => onRemovePerson(person.key)}
              onEditNote={(note) => onEditNote(person.key, note)}
            />
          ))}
        </View>
      )}
      {looseName !== null && (
        <View style={styles.looseName}>
          <View style={styles.looseNameInput}>
            <TextField
              label="Nome solto"
              value={looseName}
              onChangeText={setLooseName}
              placeholder="Quem não tem login, como o motorista"
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addLooseName}
            />
          </View>
          <Pressable
            onPress={addLooseName}
            accessibilityRole="button"
            accessibilityLabel="Adicionar nome solto"
            style={[styles.addLoose, { backgroundColor: colors.action }]}
          >
            <Text style={[styles.addLooseLabel, { color: colors.onAction }]}>Adicionar</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.adds}>
        {participants !== null && (
          <AddButton
            label="+ Participant"
            accessibilityLabel={`Adicionar Participant a ${label}`}
            onPress={() => setChoosing(true)}
          />
        )}
        <AddButton
          label="+ Nome solto"
          accessibilityLabel={`Adicionar nome solto a ${label}`}
          onPress={() => setLooseName('')}
        />
      </View>
      <View style={[styles.visibility, { backgroundColor: colors.bg }]}>
        <Text style={[styles.visibilityTitle, { color: colors.text }]}>Quem vê as notas</Text>
        <View accessibilityRole="radiogroup" style={styles.radios}>
          {VISIBILITIES.map(({ value, label: text }) => {
            const checked = field.visibility === value
            return (
              <Pressable
                key={value}
                onPress={() => onVisibility(value)}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                style={[styles.radio, checked && { backgroundColor: colors.action }]}
              >
                <Text
                  style={[
                    styles.radioLabel,
                    checked
                      ? { color: colors.onAction, fontFamily: fonts.sans600 }
                      : { color: colors.textMuted },
                  ]}
                >
                  {text}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Text style={[textStyles.caption, { color: colors.textMuted }]}>
          A produção sempre vê todas. Quem está neste Field passa a ver o item.
        </Text>
      </View>

      <Sheet visible={choosing} title="Participants" onClose={() => setChoosing(false)}>
        <ScrollView style={styles.choices} contentContainerStyle={styles.choicesList}>
          {choices.length === 0 ? (
            <Text style={[textStyles.body, { color: colors.textMuted }]}>
              Todos os Participants já estão neste Field.
            </Text>
          ) : (
            choices.map((person) => (
              <Pressable
                key={person.userId}
                onPress={() => {
                  onAddParticipant(person)
                  setChoosing(false)
                }}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${person.name}`}
                style={styles.choice}
              >
                <Avatar person={{ userId: person.userId, name: person.name }} />
                <Text style={[styles.name, styles.grow, { color: colors.text }]}>
                  {person.name}
                </Text>
                <Icon name="plus" color={colors.link} size={20} />
              </Pressable>
            ))
          )}
        </ScrollView>
      </Sheet>
    </View>
  )
}

function PersonRow({
  person,
  first,
  onRemove,
  onEditNote,
}: {
  person: PersonDraft
  first: boolean
  onRemove: () => void
  onEditNote: (note: string) => void
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.person, !first && { borderTopColor: colors.divider, borderTopWidth: 1 }]}>
      <Avatar person={person} />
      <View style={styles.grow}>
        <View style={styles.nameLine}>
          <Text
            style={[styles.name, { color: person.outOfEvent ? colors.textMuted : colors.text }]}
          >
            {person.name}
          </Text>
          {person.userId === null && <Badge label="SEM LOGIN" tone="gray" />}
          {person.outOfEvent && <Badge label="fora do Event" tone="red" />}
        </View>
        <TextInput
          value={person.note}
          onChangeText={onEditNote}
          placeholder="Nota (ex.: localizador)"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={`Nota de ${person.name}`}
          style={[styles.note, { color: colors.textMuted, borderBottomColor: colors.border }]}
        />
      </View>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Tirar ${person.name}`}
        hitSlop={4}
        style={styles.remove}
      >
        <Icon name="close" color={colors.textMuted} size={18} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

/** Initials on the person's automatic tone; a loose name, with no login, dashed and gray. */
function Avatar({ person }: { person: Pick<PersonDraft, 'userId' | 'name'> }) {
  const { teamChip, colors } = useTheme()
  const chip = teamChip(person.userId === null ? 'gray' : autoTone(person.userId))
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: chip.bg },
        person.userId === null && [styles.loose, { borderColor: colors.border }],
      ]}
    >
      <Text style={[styles.initials, { color: chip.text }]}>{initials(person.name)}</Text>
    </View>
  )
}

function AddButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string
  accessibilityLabel: string
  onPress: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.add, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <Text style={[styles.addLabel, { color: colors.link }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  kind: { fontFamily: fonts.sans700, fontSize: 12, letterSpacing: 0.5 },
  people: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  grow: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  name: { fontFamily: fonts.sans600, fontSize: 15 },
  note: {
    fontFamily: fonts.sans400,
    fontSize: 13,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 2,
    marginTop: 2,
  },
  remove: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loose: { borderWidth: 2, borderStyle: 'dashed' },
  initials: { fontFamily: fonts.sans700, fontSize: 12 },
  looseName: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  looseNameInput: { flex: 1 },
  addLoose: {
    height: spacing.touchTarget,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
    marginBottom: 4,
  },
  addLooseLabel: { fontFamily: fonts.sans600, fontSize: 14 },
  adds: { flexDirection: 'row', gap: 8 },
  add: {
    flex: 1,
    height: spacing.touchTarget,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontFamily: fonts.sans600, fontSize: 14 },
  visibility: { borderRadius: 16, padding: 12, gap: 8 },
  visibilityTitle: { fontFamily: fonts.sans700, fontSize: 14 },
  radios: { flexDirection: 'row', gap: 4 },
  radio: {
    flex: 1,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioLabel: { fontFamily: fonts.sans400, fontSize: 13 },
  choices: { maxHeight: 420 },
  choicesList: { gap: 6 },
  choice: {
    minHeight: spacing.touchTarget + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})
