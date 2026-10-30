import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { Pressable, StyleSheet, View } from 'react-native'

import { palette, useTheme } from '@/shared/theme'

const ICON_SIZE = 22
const BOTTOM = 24

/**
 * The Group's floating blue bar (Media kit: Navegação): icons only, each tab named by its screen's
 * title for screen readers; the current one on a white pill.
 */
export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { colors } = useTheme()

  return (
    <View
      style={[
        styles.bar,
        { bottom: Math.max(insets.bottom, BOTTOM), backgroundColor: colors.action },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index
        const { title, tabBarIcon } = descriptors[route.key].options
        const color = focused ? colors.action : colors.onActionMuted
        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!focused && !event.defaultPrevented) navigateToTab(route.key)
        }
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={title ?? route.name}
            accessibilityState={{ selected: focused }}
            style={[styles.item, focused && { backgroundColor: colors.onAction }]}
          >
            {tabBarIcon?.({ focused, color, size: ICON_SIZE })}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: `0 18px 30px -14px ${palette.blue[700]}B3`,
  },
  item: {
    flex: 1,
    height: 48,
    marginHorizontal: 6,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
