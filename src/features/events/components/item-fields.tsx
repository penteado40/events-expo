import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Icon, TextField, type IconName } from '@/shared/components/ui'
import { fonts, spacing, useTheme } from '@/shared/theme'

import type { FieldDraft, ItemDraftErrors } from '../item-draft'

type Props = {
  fields: FieldDraft[]
  errors: ItemDraftErrors
  onAdd: () => void
  onEdit: (key: string, changes: Partial<Pick<FieldDraft, 'name' | 'value'>>) => void
  onToggleHighlight: (key: string) => void
  onMove: (key: string, by: -1 | 1) => void
  onRemove: (key: string) => void
}

/**
 * The item's text Fields in D-Editar (PROJ-223): each with its name, its value and "no Resumo"
 * (the Highlight), moved up and down or deleted, in the order they are saved.
 */
export function ItemFields({
  fields,
  errors,
  onAdd,
  onEdit,
  onToggleHighlight,
  onMove,
  onRemove,
}: Props) {
  const { colors, badge } = useTheme()
  const danger = badge('red').text
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Fields</Text>
      {fields.map((field, index) => {
        const named = field.name.trim() || 'Field sem nome'
        const error = errors[`field:${field.key}`]
        return (
          <View
            key={field.key}
            style={[
              styles.field,
              index > 0 && { borderTopColor: colors.divider, borderTopWidth: 1 },
            ]}
          >
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
            {error && (
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: danger }]}>
                {error}
              </Text>
            )}
            <View style={styles.actions}>
              <Pressable
                onPress={() => onToggleHighlight(field.key)}
                accessibilityRole="button"
                accessibilityLabel={`${named} no Resumo`}
                accessibilityState={{ selected: field.highlight }}
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
              <View style={styles.spacer} />
              <IconButton
                icon="chevronUp"
                label={`Subir ${named}`}
                disabled={index === 0}
                onPress={() => onMove(field.key, -1)}
              />
              <IconButton
                icon="chevronDown"
                label={`Descer ${named}`}
                disabled={index === fields.length - 1}
                onPress={() => onMove(field.key, 1)}
              />
              <IconButton
                icon="close"
                label={`Apagar ${named}`}
                onPress={() => onRemove(field.key)}
              />
            </View>
          </View>
        )
      })}
      <Pressable onPress={onAdd} accessibilityRole="button" style={styles.add}>
        <Text style={[styles.addLabel, { color: colors.link }]}>+ Field de texto</Text>
      </Pressable>
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
  add: { alignSelf: 'flex-start', height: spacing.touchTarget, justifyContent: 'center' },
  addLabel: { fontFamily: fonts.sans700, fontSize: 14 },
})
