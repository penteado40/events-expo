import type { ComponentProps } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Tabs from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/shared/theme'

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const ICON_SIZE = 22
const BOTTOM = 24

/**
 * The Group's floating blue bar (Media kit: Navegação): icons only, each tab named by its screen's
 * title for screen readers; the current one on a white pill.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

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
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
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
    boxShadow: '0 18px 30px -14px rgba(31,79,174,0.7)',
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
