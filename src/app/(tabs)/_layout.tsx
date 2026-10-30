import Tabs from 'expo-router/js-tabs'

import { FloatingTabBar, Icon } from '@/shared/components/ui'
import { useTheme } from '@/shared/theme'

/** The Group's tabs: Início, Hoje, Pessoas, Perfil, on the floating blue bar. */
export default function TabsLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      // Back from another tab returns to Início.
      backBehavior="initialRoute"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: (props) => <Icon name="home" {...props} /> }}
      />
      <Tabs.Screen
        name="today"
        options={{ title: 'Hoje', tabBarIcon: (props) => <Icon name="today" {...props} /> }}
      />
      <Tabs.Screen
        name="people"
        options={{ title: 'Pessoas', tabBarIcon: (props) => <Icon name="people" {...props} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: (props) => <Icon name="profile" {...props} /> }}
      />
    </Tabs>
  )
}
