import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { Badge, Icon } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { initials } from '@/shared/domain/initials'
import { whatsappUrl } from '@/shared/domain/phone'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import type { GroupMember } from '../schemas'

type Props = { member: GroupMember; isMe: boolean }

/**
 * A person on the Pessoas tab (D-Pessoas): the avatar ringed in their first Team's color (dashed
 * while the invitation is pending), name, Teams and, for someone else who has joined, WhatsApp.
 */
export function MemberRow({ member, isMe }: Props) {
  const { colors, badge } = useTheme()
  const { name, teams, isPending, role, phone } = member
  const firstTeamTone = teams[0] ? autoTone(teams[0].id) : null
  const url = isMe || isPending ? null : whatsappUrl(phone)
  const subtitle = isPending ? 'ainda não entrou' : teams.map((t) => t.name).join(', ')
  const whatsapp = badge('green')

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor:
              isMe && firstTeamTone ? palette[firstTeamTone][100] : palette.gray[100],
          },
          firstTeamTone &&
            !isPending && { boxShadow: `0 0 0 2.5px ${palette[firstTeamTone][500]}` },
          isPending && [styles.pendingAvatar, { borderColor: colors.border }],
        ]}
      >
        <Text
          style={[
            styles.initials,
            {
              color: isPending
                ? palette.gray[700]
                : isMe && firstTeamTone
                  ? palette[firstTeamTone][700]
                  : palette.gray[900],
            },
          ]}
        >
          {initials(name)}
        </Text>
      </View>
      <View style={styles.names}>
        <Text style={[styles.name, { color: colors.text }]}>
          {name}
          {isMe && ' · você'}
        </Text>
        {subtitle !== '' && (
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>{subtitle}</Text>
        )}
      </View>
      {role === 'OWNER' && <Badge label="Owner" tone="blue" />}
      {isPending && <Badge label="Convite pendente" tone="gold" />}
      {url && (
        <Pressable
          onPress={() => Linking.openURL(url)}
          accessibilityRole="link"
          accessibilityLabel={`WhatsApp de ${name}`}
          style={[styles.whatsapp, { backgroundColor: whatsapp.bg }]}
        >
          <Icon name="phone" color={whatsapp.text} size={18} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAvatar: { borderWidth: 2, borderStyle: 'dashed' },
  initials: { fontFamily: fonts.sans700, fontSize: 13 },
  names: { flex: 1 },
  name: { fontFamily: fonts.sans600, fontSize: 16 },
  whatsapp: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
