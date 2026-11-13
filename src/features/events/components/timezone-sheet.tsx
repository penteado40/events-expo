import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'

import { Icon, Sheet } from '@/shared/components/ui'
import { spacing, textStyles, useTheme } from '@/shared/theme'

type Props<Choice extends string | null> = {
  visible: boolean
  title: string
  value: Choice
  choices: readonly Choice[]
  /** "Manaus (GMT−4)", or "Fuso do Event · Manaus (GMT−4)" for `null`. */
  labelOf: (choice: Choice) => string
  onChoose: (choice: Choice) => void
  onClose: () => void
}

/** A low sheet listing timezones by city and offset: the Event's default one, or an item's place's. */
export function TimezoneSheet<Choice extends string | null>({
  visible,
  title,
  value,
  choices,
  labelOf,
  onChoose,
  onClose,
}: Props<Choice>) {
  const { colors } = useTheme()
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <ScrollView style={styles.choices} contentContainerStyle={styles.choicesList}>
        {choices.map((choice) => {
          const selected = choice === value
          const label = labelOf(choice)
          return (
            <Pressable
              key={choice ?? 'event'}
              onPress={() => {
                onChoose(choice)
                onClose()
              }}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              style={[
                styles.choice,
                selected && { backgroundColor: colors.surfaceBrand, borderColor: colors.action },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.text }]}>{label}</Text>
              {selected && <Icon name="check" color={colors.action} size={20} />}
            </Pressable>
          )
        })}
      </ScrollView>
    </Sheet>
  )
}

const styles = StyleSheet.create({
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
