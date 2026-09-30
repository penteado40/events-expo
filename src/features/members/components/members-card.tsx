import { Fragment } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Glass, QueryError, SkeletonBlock } from '@/shared/components/ui'
import { memberRoleLabel } from '@/shared/domain/roles'
import { colors, fonts, radii, textStyles } from '@/shared/theme'

import { useMembers } from '../hooks/use-members'

const SKELETON_ROWS = 3

/** The Resumo's Members card: name and role per Event member, 1 px dividers. */
export function MembersCard({ eventId }: { eventId: number }) {
  const members = useMembers(eventId)

  if (members.isError && !members.data) {
    return <QueryError message={members.error.message} onRetry={() => members.refetch()} />
  }
  return (
    <Glass variant="card" radius={radii.stat} contentStyle={styles.card}>
      {!members.data ? (
        Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row} accessibilityLabel="Carregando membros">
              <SkeletonBlock width={140} height={14} />
              <SkeletonBlock width={60} height={12} />
            </View>
          </Fragment>
        ))
      ) : members.data.length === 0 ? (
        <Text style={[styles.name, styles.empty]}>Nenhum membro.</Text>
      ) : (
        members.data.map((member, index) => (
          <Fragment key={member.userId}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {member.name}
              </Text>
              <Text style={textStyles.monoCaption}>{memberRoleLabel(member)}</Text>
            </View>
          </Fragment>
        ))
      )}
    </Glass>
  )
}

const styles = StyleSheet.create({
  card: { paddingVertical: 4, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: { height: 1, backgroundColor: colors.divider },
  name: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 14, color: colors.text },
  empty: { paddingVertical: 12, color: colors.textMuted },
})
