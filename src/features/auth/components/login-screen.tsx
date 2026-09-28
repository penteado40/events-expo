import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ErrorBox, Glass } from '@/shared/components/ui'
import { validationError } from '@/shared/lib/api-error'
import { useLastEmail } from '@/shared/session'
import { colors, fonts, radii, textStyles } from '@/shared/theme'

import { useEnterDemo } from '../hooks/use-enter-demo'
import { useLogin } from '../hooks/use-login'
import { loginInputSchema, type LoginInput } from '../schemas'

export function LoginScreen() {
  const insets = useSafeAreaInsets()
  const login = useLogin()
  const enterDemo = useEnterDemo()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    // Read once, not subscribed: the splash waits for the store to hydrate, and Login remounts
    // after "Sair" (Stack.Protected), so this is always the current saved email.
    defaultValues: { email: useLastEmail.getState().email, password: '' },
  })

  // A new attempt or an edit clears the previous API error.
  const submit = () => {
    login.reset()
    handleSubmit((input) => login.mutate(input))()
  }
  const clearErrorOnChange = (onChange: (text: string) => void) => (text: string) => {
    if (login.error) login.reset()
    onChange(text)
  }

  const error = errors.email || errors.password ? validationError() : login.error

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[styles.screen, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 30 }]}
      >
        <View style={styles.brand}>
          <View style={styles.dot} />
          <Text style={styles.brandText}>events-api</Text>
        </View>
        <Text style={styles.title}>Entre para gerenciar seus eventos.</Text>

        <View style={styles.flex} />

        <Glass variant="card" radius={radii.loginCard} contentStyle={styles.card}>
          <Text style={styles.endpoint}>POST /api/v1/auth/login</Text>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                value={field.value}
                onChangeText={clearErrorOnChange(field.onChange)}
                onBlur={field.onBlur}
                placeholder="email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                value={field.value}
                onChangeText={clearErrorOnChange(field.onChange)}
                onBlur={field.onBlur}
                placeholder="senha"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={submit}
              />
            )}
          />
          {error && <ErrorBox code={error.code} message={error.message} />}
          <Pressable
            accessibilityRole="button"
            disabled={login.isPending}
            onPress={submit}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>{login.isPending ? 'Entrando…' : 'Entrar'}</Text>
          </Pressable>
          {__DEV__ && (
            <Pressable
              accessibilityRole="button"
              onPress={enterDemo}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Modo demo</Text>
            </Pressable>
          )}
        </Glass>
      </View>
    </KeyboardAvoidingView>
  )
}

function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.accent}
      style={styles.input}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    boxShadow: `0 0 12px ${colors.accent}`,
  },
  brandText: { fontFamily: fonts.mono500, fontSize: 14, color: colors.text },
  title: {
    marginTop: 28,
    fontFamily: fonts.sans500,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.34,
    color: colors.text,
  },
  card: { padding: 18, gap: 12 },
  endpoint: textStyles.monoCaption,
  input: {
    height: 52,
    borderRadius: radii.input,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    fontFamily: fonts.mono400,
    fontSize: 16,
    color: colors.text,
  },
  primary: {
    height: 56,
    borderRadius: radii.primaryButton,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,.6), 0 8px 24px -8px ${colors.accentGlow}`,
  },
  primaryText: { fontFamily: fonts.sans600, fontSize: 16, color: colors.onAccent },
  secondary: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryButtonBg,
    borderWidth: 1,
    borderColor: colors.secondaryButtonBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontFamily: fonts.sans500, fontSize: 15, color: colors.text },
  pressed: { transform: [{ scale: 0.98 }] },
})
