import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Icon, TextField, type IconName } from '@/shared/components/ui'
import { fonts, spacing, useTheme } from '@/shared/theme'

import type { PersonalNotesVisibility } from '../api'
import {
  fieldErrorKey,
  type FieldDraft,
  type FieldTextChanges,
  type ItemDraftErrors,
  type PersonChoice,
} from '../item-draft'
import { PeopleField } from './people-field'

/** The editor's actions on a Field of people, by the Field's key. */
export type PeopleFieldActions = {
  onAddParticipant: (key: string, person: PersonChoice) => void
  onAddLooseName: (key: string, name: string) => void
  onRemovePerson: (key: string, personKey: string) => void
  onEditNote: (key: string, personKey: string, note: string) => void
  onVisibility: (key: string, visibility: PersonalNotesVisibility) => void
}

type Props = {
  fields: FieldDraft[]
  errors: ItemDraftErrors
  /** Whether Fields of people can be added here. */
  canAddPeopleFields: boolean
  /** Whether a Field can go "no Resumo" (the Highlight; not over the events-api yet). */
  canHighlight: boolean
  /** Whether Fields of people take Personal notes (not over the events-api yet). */
  canWriteNotes: boolean
  /**
   * The Event's Participants for "+ Participant": `undefined` while they load, `null` where there
   * are none to read.
   */
  participants: PersonChoice[] | null | undefined
  onAdd: () => void
  onAddPeople: () => void
  onEdit: (key: string, changes: FieldTextChanges) => void
  onToggleHighlight: (key: string) => void
  onMove: (key: string, by: -1 | 1) => void
  onRemove: (key: string) => void
  peopleActions: PeopleFieldActions
}

/**
 * The item's Fields in D-Editar: text ones (PROJ-223) with their name and value, and of people
 * (PROJ-225) with their people and Personal notes; each with "no Resumo" (the Highlight), moved
 * up and down or deleted, in the order they are saved.
 */
export function ItemFields({
  fields,
  errors,
  canAddPeopleFields,
  canHighlight,
  canWriteNotes,
  participants,
  onAdd,
  onAddPeople,
  onEdit,
  onToggleHighlight,
  onMove,
  onRemove,
  peopleActions,
}: Props) {
  const { colors, badge } = useTheme()
  const danger = badge('red').text
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Fields</Text>
      {fields.map((field, index) => {
        const label = field.name.trim() || 'Field sem nome'
        const error = errors[fieldErrorKey(field.key)]
        return (
          <View
            key={field.key}
            style={[
              styles.field,
              index > 0 && { borderTopColor: colors.divider, borderTopWidth: 1 },
            ]}
          >
            {field.type === 'TEXT' ? (
              <>
                <TextField
                  label="Nome do Field"
                  value={field.name}
                  onChangeText={(name) => onEdit(field.key, { name })}
                  placeholder="Obs, Contatos, Voltagem…"
                  autoCapitalize="sentences"
                />
                <TextField
                  label="Valor"
                  value={field.value}
                  onChangeText={(value) => onEdit(field.key, { value })}
                  multiline
                />
              </>
            ) : (
              <PeopleField
                field={field}
                notesAvailable={canWriteNotes}
                participants={participants}
                onRename={(name) => onEdit(field.key, { name })}
                onAddParticipant={(person) => peopleActions.onAddParticipant(field.key, person)}
                onAddLooseName={(name) => peopleActions.onAddLooseName(field.key, name)}
                onRemovePerson={(personKey) => peopleActions.onRemovePerson(field.key, personKey)}
                onEditNote={(personKey, note) =>
                  peopleActions.onEditNote(field.key, personKey, note)
                }
                onVisibility={(visibility) => peopleActions.onVisibility(field.key, visibility)}
              />
            )}
            {error && (
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: danger }]}>
                {error}
              </Text>
            )}
            <View style={styles.actions}>
              {canHighlight && (
                <Pressable
                  onPress={() => onToggleHighlight(field.key)}
                  accessibilityRole="switch"
                  accessibilityLabel={`${label} no Resumo`}
                  accessibilityState={{ checked: field.highlight }}
                  hitSlop={4}
                  style={[
                    styles.highlight,
                    field.highlight
                      ? { backgroundColor: colors.action, borderColor: colors.action }
                      : { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.highlightLabel,
                      field.highlight
                        ? { color: colors.onAction, fontFamily: fonts.sans600 }
                        : { color: colors.textMuted },
                    ]}
                  >
                    no Resumo
                  </Text>
                </Pressable>
              )}
              <View style={styles.spacer} />
              <IconButton
                icon="chevronUp"
                label={`Subir ${label}`}
                disabled={index === 0}
                onPress={() => onMove(field.key, -1)}
              />
              <IconButton
                icon="chevronDown"
                label={`Descer ${label}`}
                disabled={index === fields.length - 1}
                onPress={() => onMove(field.key, 1)}
              />
              <IconButton
                icon="close"
                label={`Apagar ${label}`}
                onPress={() => onRemove(field.key)}
              />
            </View>
          </View>
        )
      })}
      <View style={styles.adds}>
        <Pressable onPress={onAdd} accessibilityRole="button" style={styles.add}>
          <Text style={[styles.addLabel, { color: colors.link }]}>+ Field de texto</Text>
        </Pressable>
        {canAddPeopleFields && (
          <Pressable onPress={onAddPeople} accessibilityRole="button" style={styles.add}>
            <Text style={[styles.addLabel, { color: colors.link }]}>+ Field de pessoas</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

function IconButton({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: IconName
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={[styles.iconButton, disabled && styles.disabled]}
    >
      <Icon name={icon} color={colors.textMuted} size={20} strokeWidth={2} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, paddingHorizontal: 14, paddingTop: 14, marginTop: 4 },
  title: { fontFamily: fonts.sans700, fontSize: 17, marginBottom: 4 },
  field: { gap: 8, paddingVertical: 12 },
  error: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  highlight: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  highlightLabel: { fontFamily: fonts.sans400, fontSize: 13 },
  spacer: { flex: 1 },
  iconButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  adds: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 },
  add: { alignSelf: 'flex-start', height: spacing.touchTarget, justifyContent: 'center' },
  addLabel: { fontFamily: fonts.sans700, fontSize: 14 },
})
