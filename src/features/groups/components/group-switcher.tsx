import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Icon, Sheet } from '@/shared/components/ui'
import { initials } from '@/shared/domain/initials'
import { fonts, palette, spacing, useTheme } from '@/shared/theme'

import type { CurrentGroup, GroupRole } from '../current-group'

const ROLE_LABEL: Record<GroupRole, string> = {
  OWNER: 'Owner',
  VIEWER: 'Viewer',
  SUPER_ADMIN: 'Super admin',
}

type Props = {
  current: CurrentGroup
  options: CurrentGroup[]
  onChoose: (groupId: number) => void
}

/** The Group pill of the header and its "Seus Groups" sheet (D-TrocarGroup). */
export function GroupSwitcher({ current, options, onChoose }: Props) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${current.name}, trocar de Group`}
        style={({ pressed }) => [styles.pill, pressed && { opacity: 0.75 }]}
      >
        <Text numberOfLines={1} style={styles.pillLabel}>
          {current.name}
        </Text>
        <Icon name="chevronDown" color="#FFFFFF" size={16} strokeWidth={2.2} />
      </Pressable>

      <Sheet visible={open} title="Seus Groups" onClose={() => setOpen(false)}>
        {options.map((group) => {
          const selected = group.id === current.id
          return (
            <Pressable
              key={group.id}
              onPress={() => {
                onChoose(group.id)
                setOpen(false)
              }}
              accessibilityRole="button"
              accessibilityLabel={`${group.name}, ${ROLE_LABEL[group.role]}`}
              accessibilityState={{ selected }}
              style={[
                styles.option,
                selected
                  ? { backgroundColor: colors.surfaceBrand, borderColor: colors.action }
                  : { backgroundColor: colors.bg, borderColor: 'transparent' },
              ]}
            >
              <View
                style={[
                  styles.mark,
                  { backgroundColor: selected ? colors.action : palette.gray[500] },
                ]}
              >
                <Text style={styles.markLabel}>{initials(group.name)}</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionName, { color: colors.text }]}>{group.name}</Text>
                <Text style={[styles.optionRole, { color: colors.textMuted }]}>
                  {ROLE_LABEL[group.role]}
                </Text>
              </View>
              {selected && <Icon name="check" color={colors.action} size={22} strokeWidth={2.4} />}
            </Pressable>
          )
        })}
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Para entrar em outro Group, peça um convite à produção dele.
        </Text>
      </Sheet>
    </>
  )
}

const styles = StyleSheet.create({
  pill: {
    height: spacing.touchTarget,
    maxWidth: 240,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillLabel: { flexShrink: 1, fontFamily: fonts.sans600, fontSize: 14, color: '#FFFFFF' },
  option: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLabel: { fontFamily: fonts.sans700, fontSize: 15, color: '#FFFFFF' },
  optionText: { flex: 1 },
  optionName: { fontFamily: fonts.sans600, fontSize: 16 },
  optionRole: { fontFamily: fonts.sans400, fontSize: 13 },
  hint: { fontFamily: fonts.sans400, fontSize: 13, textAlign: 'center' },
})
