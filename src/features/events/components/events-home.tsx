import { useRouter } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import { ErrorState, GroupGreeting, GroupHeader, Icon, ListSkeleton } from '@/shared/components/ui'
import { autoTone } from '@/shared/domain/auto-tone'
import { initials } from '@/shared/domain/initials'
import type { GroupRole } from '@/shared/domain/group-role'
import { useSession } from '@/shared/session'
import { fonts, palette, spacing, textStyles, useTheme } from '@/shared/theme'

import { headerSnap } from '../header-snap'
import { homeLines, type HomeTab } from '../home-lines'
import { useGroupEvents } from '../hooks/use-group-events'
import { EventLine } from './event-line'

const TABS: { tab: HomeTab; label: string; empty: string }[] = [
  { tab: 'upcoming', label: 'Próximos', empty: 'Nenhum Event marcado ainda.' },
  { tab: 'going', label: 'Que eu vou', empty: 'Você não vai a nenhum Event marcado.' },
  { tab: 'past', label: 'Passados', empty: 'Nenhum Event passado.' },
]

type Props = {
  groupId: number
  /** The person's role in the Group. */
  role: GroupRole
  /** The header's Group pill, which opens "Seus Groups". */
  groupSwitcher: ReactNode
  /** Pulling down also refreshes what is around the list: the Groups and the User's role. */
  onRefresh?: () => Promise<unknown>
}

/** The header's gap between its rows: folding the greeting folds the gap above the search too. */
const HEADER_GAP = 14
/** A drag let go slower than this (either platform's units) has no momentum to wait for. */
const RESTING_VELOCITY = 0.1

/**
 * The Início of a Group (D-Início, PROJ-215): the blue header with the Group, the greeting and the
 * search, and the tabs, fixed above the Group's Events. Only the list scrolls and pulls to refresh;
 * a return to the app refetches. Scrolling the list folds the greeting away with the finger, and
 * the list settles open or folded; switching tabs or searching starts the list at its top.
 */
export function EventsHome({ groupId, role, groupSwitcher, onRefresh }: Props) {
  const { colors } = useTheme()
  const router = useRouter()
  const user = useSession((state) => state.session?.user)
  const [tab, setTab] = useState<HomeTab>('upcoming')
  const [query, setQuery] = useState('')
  const [pulling, setPulling] = useState(false)
  const events = useGroupEvents(groupId)

  const list = useAnimatedRef<Animated.ScrollView>()
  const offset = useSharedValue(0)
  const greetingHeight = useSharedValue(0)
  const settle = (y: number) => {
    'worklet'
    const target = headerSnap(y, greetingHeight.value + HEADER_GAP)
    if (target !== null) scrollTo(list, 0, target, true)
  }
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      offset.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      if (Math.abs(event.velocity?.y ?? 0) < RESTING_VELOCITY) settle(event.contentOffset.y)
    },
    onMomentumEnd: (event) => settle(event.contentOffset.y),
  })
  const greetingFold = useAnimatedStyle(() => {
    const height = greetingHeight.value
    if (!height) return {}
    const range = [0, height + HEADER_GAP]
    return {
      height: interpolate(offset.value, range, [height, 0], Extrapolation.CLAMP),
      marginBottom: interpolate(offset.value, range, [0, -HEADER_GAP], Extrapolation.CLAMP),
      opacity: interpolate(offset.value, [0, height * 0.6], [1, 0], Extrapolation.CLAMP),
    }
  })
  const toTop = () => {
    list.current?.scrollTo({ y: 0, animated: false })
    offset.set(0)
  }

  const lines = events.data ? homeLines(events.data, { tab, query, now: new Date(), role }) : []
  const empty = query.trim()
    ? `Nenhum Event encontrado para “${query.trim()}”.`
    : TABS.find((t) => t.tab === tab)!.empty

  const refresh = async () => {
    setPulling(true)
    try {
      await Promise.all([events.refetch(), onRefresh?.()])
    } finally {
      setPulling(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <GroupHeader>
        <View style={styles.topRow}>
          {groupSwitcher}
          {user && (
            <Pressable
              onPress={() => router.navigate('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Perfil"
              style={[styles.avatar, { boxShadow: `0 0 0 3px ${palette[autoTone(user.id)][100]}` }]}
            >
              <Text style={styles.avatarLabel}>{initials(user.name)}</Text>
            </Pressable>
          )}
        </View>
        <Animated.View style={[styles.fold, greetingFold]}>
          <View
            style={styles.greeting}
            onLayout={(e) => {
              // The greeting's own height, never the fold's: a folded wrapper must not measure 0,
              // or the header could no longer open again at the top.
              const height = e.nativeEvent.layout.height
              if (height > 0) greetingHeight.set(height)
            }}
          >
            <GroupGreeting />
          </View>
        </Animated.View>
        <View style={styles.search}>
          <Icon name="search" color={palette.blue[100]} size={18} />
          <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text)
              toTop()
            }}
            placeholder="Buscar evento"
            accessibilityLabel="Buscar evento"
            placeholderTextColor={palette.blue[100]}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
      </GroupHeader>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map(({ tab: id, label }) => {
          const selected = id === tab
          return (
            <Pressable
              key={id}
              onPress={() => {
                setTab(id)
                toTop()
              }}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              hitSlop={8}
            >
              <Text
                style={[
                  selected ? styles.tabSelected : styles.tab,
                  { color: selected ? colors.text : palette.gray[500] },
                ]}
              >
                {label}
                {selected && <Text style={{ color: palette.coral[500] }}>·</Text>}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Animated.ScrollView
        ref={list}
        testID="home-list"
        style={styles.screen}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={refresh} tintColor={colors.action} />
        }
      >
        {events.isPending ? (
          <ListSkeleton />
        ) : events.error && !events.data ? (
          <ErrorState message={events.error.message} onRetry={() => events.refetch()} />
        ) : lines.length === 0 ? (
          <Text style={[textStyles.body, styles.empty, { color: colors.textMuted }]}>{empty}</Text>
        ) : (
          lines.map((line) => <EventLine key={line.event.id} line={line} />)
        )}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fold: { overflow: 'hidden' },
  greeting: { flexShrink: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  avatar: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: fonts.sans700, fontSize: 14, color: palette.blue[900] },
  search: {
    height: 46,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  searchInput: { flex: 1, fontFamily: fonts.sans400, fontSize: 15, color: '#FFFFFF', padding: 0 },
  tabs: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 18,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  list: { paddingHorizontal: 20, gap: 14, paddingBottom: spacing.tabBarClearance },
  tab: { fontFamily: fonts.sans500, fontSize: 20 },
  tabSelected: { fontFamily: fonts.sans700, fontSize: 24 },
  empty: { paddingVertical: 24, textAlign: 'center' },
})
