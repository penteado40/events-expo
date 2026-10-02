import Tabs from 'expo-router/js-tabs'

import { FloatingTabBar } from '@/shared/components/ui'

export default function TabsLayout() {
  return (
    <Tabs
      // Início, in the middle, is where a Session lands.
      initialRouteName="index"
      // Back from another tab returns to Início, not to the first tab (Eventos).
      backBehavior="initialRoute"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        // Scenes are transparent (the fixed Background shows through), so the inactive tab must
        // fade to opacity 0 or it stays visible underneath.
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="events" options={{ title: 'Eventos' }} />
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  )
}
