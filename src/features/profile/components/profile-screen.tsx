import { Fragment } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, PressableGlass } from '@/shared/components/ui'
import { useSession } from '@/shared/session'
import { colors, fonts, radii, spacing, textStyles } from '@/shared/theme'

import { accountRows } from '../account-rows'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

/** Perfil: who is signed in, their account, and "Sair". */
export function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const session = useSession((state) => state.session)
  const signOut = useSession((state) => state.signOut)
  if (!session) return null

  const { user } = session

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.screen, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.title}>Perfil</Text>

      <Glass variant="card" radius={radii.heroCard} contentStyle={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.name)}</Text>
        </View>
        <View style={styles.nameLine}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {/* Demo mode exists only in development builds; a Live session shows no chip. */}
          {!session.live && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>demo</Text>
            </View>
          )}
        </View>
      </Glass>

      <Glass variant="card" radius={radii.stat} contentStyle={styles.fields}>
        {accountRows(user).map(({ label, value }, index) => (
          <Fragment key={label}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <Text style={styles.key}>{label}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {value}
              </Text>
            </View>
          </Fragment>
        ))}
      </Glass>

      <PressableGlass
        variant="pill"
        radius={radii.pillButton}
        onPress={signOut}
        accessibilityLabel="Sair"
        borderColor={colors.dangerBorder}
        contentStyle={styles.signOut}
      >
        <Text style={styles.signOutText}>Sair</Text>
      </PressableGlass>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: spacing.screen, paddingBottom: spacing.tabBarClearance, gap: 14 },
  title: { ...textStyles.screenTitle, marginBottom: 4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sans600, fontSize: 18, color: colors.onAccent },
  nameLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.sans500, fontSize: 18, color: colors.text },
  chip: {
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.chipMutedBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: { fontFamily: fonts.sans500, fontSize: 12, color: colors.textMuted },
  fields: { paddingHorizontal: 16, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  key: { fontFamily: fonts.sans400, fontSize: 13, color: colors.textMuted },
  value: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 13, color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider },
  signOut: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontFamily: fonts.sans500, fontSize: 16, color: colors.danger },
})
