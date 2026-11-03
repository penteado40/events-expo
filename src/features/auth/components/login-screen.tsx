import { useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Button, Notice, TextField } from '@/shared/components/ui'
import { CLERK_PUBLISHABLE_KEY } from '@/shared/lib/clerk-key'
import { useSession } from '@/shared/session'
import { fonts, useTheme } from '@/shared/theme'

import type { DemoAccount } from '../api'
import { useEnterDemo } from '../hooks/use-enter-demo'
import { usePasswordSignIn, useSignInCode } from '../hooks/use-password-sign-in'
import { useSsoSignIn, type SsoProvider } from '../hooks/use-sso-sign-in'
import { sessionEndMessage, signInErrorMessage } from '../sign-in-messages'
import { AuthLayout } from './auth-layout'
import { CodeField, EmailField } from './fields'
import { SocialButtons } from './social-buttons'

const DEMO_ACCOUNTS: { account: DemoAccount; label: string }[] = [
  { account: 'OWNER', label: 'Owner' },
  { account: 'VIEWER', label: 'Viewer' },
  { account: 'SUPER_ADMIN', label: 'Super admin' },
]

type Props = {
  /** False in a development build without Clerk's key: only Demo mode, and how to get the rest. */
  withClerk?: boolean
}

/** D-Login: email and password, Google or Apple, all through Clerk; no open sign-up. */
export function LoginScreen({ withClerk = CLERK_PUBLISHABLE_KEY !== null }: Props) {
  const { colors } = useTheme()
  const enterDemo = useEnterDemo()

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
      {withClerk ? (
        <ClerkSignIn />
      ) : (
        <Notice message="Para entrar pelo Clerk, ponha EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no .env e reinicie o Expo. Enquanto isso, use o modo demo." />
      )}
    </AuthLayout>
  )
}

/** The card's sign-in, which needs `<ClerkProvider>`. */
function ClerkSignIn() {
  const router = useRouter()
  const { colors } = useTheme()
  const endedBecause = useSession((state) => state.endedBecause)
  const passwordSignIn = usePasswordSignIn()
  const signInCode = useSignInCode()
  const ssoSignIn = useSsoSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  const via = passwordSignIn.data === 'signed-in' ? undefined : passwordSignIn.data
  const needsCode = via !== undefined
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
  const confirmCode = () => {
    if (via) signInCode.mutate({ via, code })
  }
  const sso = (provider: SsoProvider) => {
    passwordSignIn.reset()
    ssoSignIn.mutate(provider)
  }

  return (
    <>
      {message ? <Notice message={message} /> : null}
      {needsCode ? (
        <>
          <Text style={[styles.body, { color: colors.text }]}>
            {via === 'authenticator-code'
              ? 'Digite o código do seu app autenticador.'
              : via === 'phone-code'
                ? 'Enviamos um código por SMS para o telefone da sua conta.'
                : `Enviamos um código para ${email.trim()} para confirmar que é você.`}
          </Text>
          <CodeField value={code} onChangeText={setCode} onSubmitEditing={confirmCode} />
          <Button
            label="Confirmar"
            onPress={confirmCode}
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
          <EmailField value={email} onChangeText={setEmail} />
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
          <SocialButtons
            divider="ou"
            onPress={sso}
            pending={ssoSignIn.isPending ? ssoSignIn.variables : null}
            disabled={busy}
          />
        </>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  body: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 21 },
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
