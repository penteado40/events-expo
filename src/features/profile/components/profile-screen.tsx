import { Fragment } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, PressableGlass } from '@/shared/components/ui'
import { API_HOST } from '@/shared/lib/api-client'
import { useSession, type User } from '@/shared/session'
import { colors, fonts, radii, spacing, textStyles } from '@/shared/theme'

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
  const source = session.live ? `API real · ${API_HOST}` : 'modo demo · dados locais'
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
  name: { fontFamily: fonts.sans500, fontSize: 18, color: colors.text },
  source: { ...textStyles.monoCaption, marginTop: 2 },
  endpoint: { ...textStyles.monoCaption, marginTop: 6 },
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
