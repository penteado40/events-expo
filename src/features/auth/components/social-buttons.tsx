import * as WebBrowser from 'expo-web-browser'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { Button } from '@/shared/components/ui'
import { fonts, palette, useTheme } from '@/shared/theme'

import type { SsoProvider } from '../hooks/use-sso-sign-in'

// Closes the browser Google or Apple left open once it redirects back to the app.
WebBrowser.maybeCompleteAuthSession()

type Props = {
  /** The divider's text: "ou" on the login, "ou com o mesmo e-mail" on "Ativar conta". */
  divider: string
  onPress: (provider: SsoProvider) => void
  /** The provider whose flow is running, for its spinner. */
  pending: SsoProvider | null
  disabled: boolean
}

/** The divider, then "Google" and "Apple" side by side (D-Login, D-Ativar). */
export function SocialButtons({ divider, onPress, pending, disabled }: Props) {
  const { colors } = useTheme()

  return (
    <>
      <View style={styles.or}>
        <View style={[styles.line, { backgroundColor: colors.divider }]} />
        <Text style={[styles.orText, { color: palette.gray[500] }]}>{divider}</Text>
        <View style={[styles.line, { backgroundColor: colors.divider }]} />
      </View>
      <View style={styles.social}>
        <Button
          label="Google"
          variant="secondary"
          onPress={() => onPress('google')}
          loading={pending === 'google'}
          disabled={disabled}
          icon={<Text style={[styles.google, { color: colors.link }]}>G</Text>}
          style={styles.socialButton}
        />
        <Button
          label="Apple"
          variant="dark"
          onPress={() => onPress('apple')}
          loading={pending === 'apple'}
          disabled={disabled}
          icon={<AppleLogo />}
          style={styles.socialButton}
        />
      </View>
    </>
  )
}

function AppleLogo() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="#FFFFFF" accessible={false}>
      <Path d="M16.5 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6 0 0-2.5-1-2.5-3.7zM14.3 5.6c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" />
    </Svg>
  )
}

const styles = StyleSheet.create({
  or: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1 },
  orText: { fontFamily: fonts.sans400, fontSize: 13 },
  social: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, height: 50 },
  google: { fontFamily: fonts.sans700, fontSize: 16 },
})
