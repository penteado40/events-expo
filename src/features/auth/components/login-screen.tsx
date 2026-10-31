import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { Button, Notice, TextField } from '@/shared/components/ui'
import { useSession } from '@/shared/session'
import { fonts, palette, useTheme } from '@/shared/theme'

import type { DemoAccount } from '../api'
import { useEnterDemo } from '../hooks/use-enter-demo'
import { usePasswordSignIn, useSignInCode } from '../hooks/use-password-sign-in'
import { useSsoSignIn, type SsoProvider } from '../hooks/use-sso-sign-in'
import { sessionEndMessage, signInErrorMessage } from '../sign-in-messages'
import { AuthLayout } from './auth-layout'

// Closes the browser Google or Apple left open once it redirects back to the app.
WebBrowser.maybeCompleteAuthSession()

const DEMO_ACCOUNTS: { account: DemoAccount; label: string }[] = [
  { account: 'OWNER', label: 'Owner' },
  { account: 'VIEWER', label: 'Viewer' },
  { account: 'SUPER_ADMIN', label: 'Super admin' },
]

/** D-Login: email and password, Google or Apple, all through Clerk; no open sign-up. */
export function LoginScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const endedBecause = useSession((state) => state.endedBecause)
  const passwordSignIn = usePasswordSignIn()
  const signInCode = useSignInCode()
  const ssoSignIn = useSsoSignIn()
  const enterDemo = useEnterDemo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  const needsCode = passwordSignIn.data === 'needs-code'
  const busy = passwordSignIn.isPending || signInCode.isPending || ssoSignIn.isPending
  const error = needsCode ? signInCode.error : (passwordSignIn.error ?? ssoSignIn.error)
  const message = error
    ? signInErrorMessage(error)
    : endedBecause
      ? sessionEndMessage(endedBecause)
      : null

  const submit = () => {
    ssoSignIn.reset()
    passwordSignIn.mutate({ email, password })
  }
  const sso = (provider: SsoProvider) => {
    passwordSignIn.reset()
    ssoSignIn.mutate(provider)
  }

  return (
    <AuthLayout
      title={'A programação\ndo seu Group'}
      subtitle="Cada viagem, ensaio e show, só com o que é seu."
      footer={
        <>
          <Text style={[styles.footer, { color: colors.textMuted }]}>
            Não tem conta? Quem convida é a produção do seu Group. Use sempre o e-mail do convite.
          </Text>
          {__DEV__ ? (
            <View style={styles.demo}>
              <Text style={[styles.demoTitle, { color: colors.textMuted }]}>Modo demo</Text>
              <View style={styles.demoRow}>
                {DEMO_ACCOUNTS.map(({ account, label }) => (
                  <Button
                    key={account}
                    label={label}
                    variant="secondary"
                    onPress={() => enterDemo(account)}
                    style={styles.demoButton}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </>
      }
    >
      {message ? <Notice message={message} /> : null}
      {needsCode ? (
        <>
          <Text style={[styles.body, { color: colors.text }]}>
            Enviamos um código para {email.trim()} para confirmar que é você neste aparelho.
          </Text>
          <TextField
            label="Código"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            onSubmitEditing={() => signInCode.mutate(code)}
          />
          <Button
            label="Confirmar"
            onPress={() => signInCode.mutate(code)}
            loading={signInCode.isPending}
            disabled={!code.trim()}
          />
          <Button
            label="Usar outro e-mail"
            variant="link"
            onPress={() => {
              passwordSignIn.reset()
              signInCode.reset()
              setCode('')
            }}
          />
        </>
      ) : (
        <>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
          />
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            onSubmitEditing={submit}
          />
          <Button
            label="Entrar"
            onPress={submit}
            loading={passwordSignIn.isPending}
            disabled={busy || !email.trim() || !password}
          />
          <Button
            label="Esqueci a senha"
            variant="link"
            onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
          />
          <View style={styles.or}>
            <View style={[styles.line, { backgroundColor: colors.divider }]} />
            <Text style={[styles.orText, { color: palette.gray[500] }]}>ou</Text>
            <View style={[styles.line, { backgroundColor: colors.divider }]} />
          </View>
          <View style={styles.social}>
            <Button
              label="Google"
              variant="secondary"
              onPress={() => sso('google')}
              loading={ssoSignIn.isPending && ssoSignIn.variables === 'google'}
              disabled={busy}
              icon={<Text style={[styles.google, { color: colors.link }]}>G</Text>}
              style={styles.socialButton}
            />
            <Button
              label="Apple"
              variant="dark"
              onPress={() => sso('apple')}
              loading={ssoSignIn.isPending && ssoSignIn.variables === 'apple'}
              disabled={busy}
              icon={<AppleLogo />}
              style={styles.socialButton}
            />
          </View>
        </>
      )}
    </AuthLayout>
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
  body: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 21 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1 },
  orText: { fontFamily: fonts.sans400, fontSize: 13 },
  social: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, height: 50 },
  google: { fontFamily: fonts.sans700, fontSize: 16 },
  footer: {
    marginTop: 18,
    marginHorizontal: 32,
    fontFamily: fonts.sans400,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  demo: { marginTop: 24, marginHorizontal: 16, gap: 8 },
  demoTitle: { fontFamily: fonts.sans600, fontSize: 12, textAlign: 'center' },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoButton: { flex: 1, height: 44, paddingHorizontal: 8 },
})
