import { StyleSheet, Text, View } from 'react-native'

import { Icon } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { plural } from '@/shared/domain/plural'
import { fonts, textStyles, useTheme } from '@/shared/theme'

import type { TeamSummary } from '../people-and-teams'

/** The Teams tab (D-Teams), read only: a card per Team and what choosing one means. */
export function TeamsList({ teams }: { teams: TeamSummary[] }) {
  const { colors, cover } = useTheme()

  return (
    <View style={styles.list}>
      {teams.length === 0 ? (
        <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>
          Nenhum Team neste Group ainda.
        </Text>
      ) : (
        <View style={styles.grid}>
          {teams.map((team) => {
            const [from, to] = cover(autoTone(team.id))
            return (
              <View key={team.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.cover,
                    { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` },
                  ]}
                />
                <View style={styles.body}>
                  <Text style={[styles.name, { color: colors.text }]}>{team.name}</Text>
                  <Text style={[textStyles.caption, { color: colors.textMuted }]}>
                    {plural(team.memberCount, 'pessoa', 'pessoas')}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      )}
      <View style={[styles.info, { backgroundColor: colors.surfaceBrand }]}>
        <Icon name="alert" color={colors.link} size={18} />
        <Text style={[textStyles.caption, styles.infoText, { color: colors.text }]}>
          Um Team é um atalho. Ao escolher um Team num item ou nos Participants, entram as pessoas
          dele naquele momento; mudar o Team depois não muda o que já foi montado.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexBasis: '47%', flexGrow: 1, borderRadius: 22, overflow: 'hidden' },
  cover: { height: 70 },
  body: { paddingVertical: 12, paddingHorizontal: 14, gap: 4 },
  name: { fontFamily: fonts.sans700, fontSize: 18 },
  info: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16 },
  infoText: { flex: 1, lineHeight: 19 },
  empty: { paddingVertical: 24, textAlign: 'center' },
})
