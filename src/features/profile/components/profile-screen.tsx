import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Badge, Button } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { GROUP_ROLE_LABELS } from '@/shared/domain/group-role'
import { initials } from '@/shared/domain/initials'
import { formatPhone } from '@/shared/domain/phone'
import { useSession, type GroupMembership, type User } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

/**
 * The Perfil tab (D-Perfil, PROJ-214), over the Session's User: the avatar, name and email, the
 * phone, each Group with the role there, "Editar" and "Sair". In Demo mode a `demo` chip by the
 * name, so sample data is never taken for real.
 */
export function ProfileScreen() {
  const { colors, header } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useSession((state) => state.session?.user)
  const demo = useSession((state) => state.session?.live === false)

  if (!user) return null

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundImage: `linear-gradient(160deg, ${header[0]}, ${header[1]})`,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={[textStyles.display, styles.title]}>
            Perfil<Text style={{ color: palette.coral[100] }}>·</Text>
          </Text>
          <Pressable
            onPress={() => router.push('/profile/edit')}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            // The pill is 36 high, like the design's; the touch area stays 44.
            hitSlop={(spacing.touchTarget - EDIT_HEIGHT) / 2}
            style={({ pressed }) => [styles.edit, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.editLabel}>Editar</Text>
          </Pressable>
        </View>
      </View>

      <Identity user={user} demo={demo} />

      <View style={styles.body}>
        <Card>
          <Row
            label="Telefone · para o WhatsApp"
            value={formatPhone(user.phone) || 'Não informado'}
          />
          <Row label="E-mail · o do seu login" value={user.email} last={!user.isSuperAdmin} />
          {user.isSuperAdmin && <Row label="Papel" value="Super admin" last />}
        </Card>

        {!user.isSuperAdmin && (
          <>
            <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]}>
              Seus Groups
            </Text>
            <Card>
              {user.memberships.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  Você ainda não está em nenhum Group.
                </Text>
              ) : (
                user.memberships.map((membership, index) => (
                  <GroupRow
                    key={membership.groupId}
                    membership={membership}
                    last={index === user.memberships.length - 1}
                  />
                ))
              )}
            </Card>
          </>
        )}

        <Button label="Sair" variant="danger" onPress={() => useSession.getState().signOut()} />
      </View>
    </ScrollView>
  )
}

/** The floating card over the header: the avatar in the person's tone, name and email. */
function Identity({ user, demo }: { user: User; demo: boolean }) {
  const { colors } = useTheme()
  const tone = palette[autoTone(user.id)]

  return (
    <View style={[styles.identity, { backgroundColor: colors.surface }]}>
      <View
        accessible={false}
        style={[styles.avatar, { backgroundColor: tone[100], borderColor: tone[500] }]}
      >
        <Text style={[styles.avatarLabel, { color: tone[700] }]}>{initials(user.name)}</Text>
      </View>
      <View style={styles.nameLine}>
        <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
        {demo && <Badge label="demo" tone="gray" />}
      </View>
      <Text style={[styles.email, { color: colors.textMuted }]}>{user.email}</Text>
    </View>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return <View style={[styles.card, { backgroundColor: colors.surface }]}>{children}</View>
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme()
  return (
    <View
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
    >
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  )
}

/** A Group with its mark in the Group's tone and the role there: Owner in blue, Viewer in gray. */
function GroupRow({ membership, last }: { membership: GroupMembership; last: boolean }) {
  const { colors, badge } = useTheme()
  const role = GROUP_ROLE_LABELS[membership.role]
  const chip = badge(membership.role === 'OWNER' ? 'blue' : 'gray')

  return (
    <View
      accessible
      accessibilityLabel={`${membership.groupName}, ${role}`}
      style={[
        styles.row,
        styles.groupRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.divider },
      ]}
    >
      <View style={[styles.mark, { backgroundColor: palette[autoTone(membership.groupId)][500] }]}>
        <Text style={styles.markLabel}>{initials(membership.groupName)}</Text>
      </View>
      <Text style={[styles.groupName, { color: colors.text }]}>{membership.groupName}</Text>
      <Text style={[styles.role, { backgroundColor: chip.bg, color: chip.text }]}>{role}</Text>
    </View>
  )
}

const EDIT_HEIGHT = 36

const styles = StyleSheet.create({
  header: {
    minHeight: 230,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFFFFF' },
  edit: {
    height: EDIT_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: EDIT_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
  },
  editLabel: { fontFamily: fonts.sans600, fontSize: 14, color: '#FFFFFF' },
  identity: {
    marginTop: -110,
    marginHorizontal: spacing.screen,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 18px 32px -18px rgba(16,32,74,0.45)',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarLabel: { fontFamily: fonts.sans700, fontSize: 26 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.sans700, fontSize: 22 },
  email: { fontFamily: fonts.sans400, fontSize: 14 },
  body: { paddingTop: 16, paddingHorizontal: 20, gap: 14 },
  card: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 },
  row: { paddingVertical: 12, gap: 2 },
  rowLabel: { fontFamily: fonts.sans400, fontSize: 12 },
  rowValue: { fontFamily: fonts.sans600, fontSize: 16 },
  section: { fontFamily: fonts.sans700, fontSize: 18 },
  empty: { ...textStyles.body, paddingVertical: 12 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLabel: { fontFamily: fonts.sans700, fontSize: 14, color: '#FFFFFF' },
  groupName: { flex: 1, fontFamily: fonts.sans600, fontSize: 16 },
  role: {
    fontFamily: fonts.sans600,
    fontSize: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
})
