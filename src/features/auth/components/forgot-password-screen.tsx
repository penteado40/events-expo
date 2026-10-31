import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'

import { Button, Notice, TextField } from '@/shared/components/ui'
import { fonts, useTheme } from '@/shared/theme'

import { usePasswordReset } from '../hooks/use-password-reset'
import { signInErrorMessage } from '../sign-in-messages'
import { AuthLayout } from './auth-layout'
import { CodeField, EmailField } from './fields'

/**
 * "Esqueci a senha", Clerk's flow in three steps: the email, the code Clerk sends to it, the new
 * password. Saving it signs in, and the Session takes the person to the Início.
 */
export function ForgotPasswordScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ email?: string }>()
  const { sendCode, verifyCode, setPassword } = usePasswordReset()
  const [email, setEmail] = useState(params.email ?? '')
  const [code, setCode] = useState('')
  const [password, setNewPassword] = useState('')

  const step = verifyCode.isSuccess ? 'password' : sendCode.isSuccess ? 'code' : 'email'
  const error = { email: sendCode.error, code: verifyCode.error, password: setPassword.error }[step]

  return (
    <AuthLayout
      title="Nova senha"
      subtitle={
        step === 'email'
          ? 'Enviamos um código para o e-mail da sua conta.'
          : `Código enviado para ${email.trim()}.`
      }
      onBack={() => router.back()}
    >
      {error ? <Notice message={signInErrorMessage(error)} /> : null}
      {step === 'email' ? (
        <>
          <EmailField
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => sendCode.mutate(email)}
          />
          <Button
            label="Enviar código"
            onPress={() => sendCode.mutate(email)}
            loading={sendCode.isPending}
            disabled={!email.trim()}
          />
        </>
      ) : step === 'code' ? (
        <>
          <CodeField
            value={code}
            onChangeText={setCode}
            onSubmitEditing={() => verifyCode.mutate(code)}
          />
          <Button
            label="Continuar"
            onPress={() => verifyCode.mutate(code)}
            loading={verifyCode.isPending}
            disabled={!code.trim()}
          />
          <Button label="Reenviar código" variant="link" onPress={() => sendCode.mutate(email)} />
        </>
      ) : (
        <>
          <TextField
            label="Nova senha"
            value={password}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            onSubmitEditing={() => setPassword.mutate(password)}
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>Pelo menos 8 caracteres.</Text>
          <Button
            label="Salvar e entrar"
            onPress={() => setPassword.mutate(password)}
            loading={setPassword.isPending}
            disabled={!password}
          />
        </>
      )}
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.sans400, fontSize: 13 },
})
