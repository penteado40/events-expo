import { Fragment } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, PressableGlass } from '@/shared/components/ui'
import { useSession, type User } from '@/shared/session'
import { colors, fonts, radii, spacing } from '@/shared/theme'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

/** Perfil: who is signed in, the raw `GET /me` fields, and "Sair". */
export function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const session = useSession((state) => state.session)
  const signOut = useSession((state) => state.signOut)
  if (!session) return null

  const { user } = session
  // PROJ-86 adds the API host: `API real · {host}`.
  const source = session.live ? 'API real' : 'modo demo · dados locais'
  const rows: [keyof User, string][] = [
    ['id', String(user.id)],
    ['name', user.name],
    ['email', user.email],
    ['role', user.role],
    ['createdAt', user.createdAt],
  ]

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
        <View style={styles.flex}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.source}>{source}</Text>
        </View>
      </Glass>

      <Text style={styles.endpoint}>GET /api/v1/me</Text>
      <Glass variant="card" radius={radii.stat} contentStyle={styles.fields}>
        {rows.map(([key, value], index) => (
          <Fragment key={key}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <Text style={styles.key}>{key}</Text>
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
        borderColor="rgba(255,154,134,.3)"
        contentStyle={styles.signOut}
      >
        <Text style={styles.signOutText}>Sair</Text>
      </PressableGlass>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // 120 bottom padding keeps content clear of the floating tab bar.
  screen: { paddingHorizontal: spacing.screen, paddingBottom: 120, gap: 14 },
  title: { fontFamily: fonts.sans600, fontSize: 32, color: colors.text, marginBottom: 4 },
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
  name: { fontFamily: fonts.sans500, fontSize: 18, color: colors.text },
  source: { fontFamily: fonts.mono400, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  endpoint: { fontFamily: fonts.mono400, fontSize: 12, color: colors.textMuted, marginTop: 6 },
  fields: { paddingHorizontal: 16, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  key: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted },
  value: { flexShrink: 1, fontFamily: fonts.mono400, fontSize: 13, color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider },
  signOut: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontFamily: fonts.sans500, fontSize: 16, color: colors.danger },
})
