import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, useColorScheme } from 'react-native'

import { Button, Icon, Sheet, TextField } from '@/shared/components/ui'
import {
  dateFromTyping,
  deviceDateOf,
  deviceToday,
  typedDate,
  typingDate,
  type LocalDate,
} from '@/shared/domain/local-dates'
import { useTheme } from '@/shared/theme'

type Props = {
  label: string
  /** As typed, `DD/MM/AAAA`. */
  value: string
  onChange: (typed: string) => void
  error?: string | null
  /** Where the calendar opens when the field holds no date yet (e.g. the start, for the end). */
  opensOn?: LocalDate | null
}

/**
 * A date of the Event: typed on the number pad, the slashes put in as it goes, or chosen on the
 * calendar beside it (the system's: a sheet on iOS, a dialog on Android; none on the web).
 */
export function DateField({ label, value, onChange, error, opensOn }: Props) {
  const { colors } = useTheme()
  const scheme = useColorScheme()
  const [choosing, setChoosing] = useState<Date | null>(null)
  const current = () => deviceDateOf(dateFromTyping(value) ?? opensOn ?? deviceToday(new Date()))
  const choose = (date: Date) => onChange(typedDate(deviceToday(date)))

  const openCalendar = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current(),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) choose(date)
        },
      })
    } else {
      setChoosing(current())
    }
  }

  return (
    <>
      <TextField
        label={label}
        value={value}
        onChangeText={(text) => onChange(typingDate(text))}
        error={error}
        placeholder="dd/mm/aaaa"
        keyboardType="number-pad"
        accessory={
          Platform.OS === 'web' ? null : (
            <Pressable
              onPress={openCalendar}
              accessibilityRole="button"
              accessibilityLabel={`Escolher no calendário: ${label}`}
              hitSlop={10}
              style={styles.calendar}
            >
              <Icon name="calendar" color={colors.textMuted} size={20} />
            </Pressable>
          )
        }
      />
      {Platform.OS === 'ios' && (
        <Sheet visible={choosing !== null} title={label} onClose={() => setChoosing(null)}>
          {choosing && (
            <DateTimePicker
              value={choosing}
              mode="date"
              display="inline"
              locale="pt-BR"
              themeVariant={scheme === 'dark' ? 'dark' : 'light'}
              accentColor={colors.action}
              onChange={(_, date) => date && setChoosing(date)}
            />
          )}
          <Button
            label="Usar esta data"
            onPress={() => {
              if (choosing) choose(choosing)
              setChoosing(null)
            }}
          />
        </Sheet>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  calendar: { padding: 2 },
})
