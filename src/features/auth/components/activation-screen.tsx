import { useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Badge, Button, Notice, TextField } from '@/shared/components/ui'
import { initials } from '@/shared/domain/initials'
import { CLERK_PUBLISHABLE_KEY } from '@/shared/lib/clerk-key'
import { DEMO_BUILD } from '@/shared/lib/demo-build'
import { fonts, useTheme } from '@/shared/theme'

import { activationTitle, type ActivationLink } from '../activation-link'
import { SignInError } from '../clerk-sign-in'
import { useActivation } from '../hooks/use-activation'
import type { SsoProvider } from '../hooks/use-sso-sign-in'
import { activationErrorMessage } from '../sign-in-messages'
import { AuthLayout } from './auth-layout'
import { SocialButtons } from './social-buttons'

type Props = {
  link: ActivationLink
  /** False in a development build without Clerk's key: an invitation can't be accepted. */
  withClerk?: boolean
  /** A Demo build (a preview): no Clerk, so no invitation can be accepted there. */
  demoBuild?: boolean
}

/**
 * D-Ativar: the Activation link opens it (events-api ADR-0020). Who invited and to which Group,
 * the invitation's email locked, then a new password or Google or Apple of that email. Once
 * active, the Live session opens and the Session guard takes the person to the Início.
 */
export function ActivationScreen({
  link,
  withClerk = CLERK_PUBLISHABLE_KEY !== null,
  demoBuild = DEMO_BUILD,
}: Props) {
  return (
    <AuthLayout
      eyebrow={<Badge label="CONVITE" tone="green" />}
      title={activationTitle(link)}
      subtitle="Escolha como vai entrar. Depois é só usar o mesmo jeito."
      footer={
        <View style={styles.warning}>
          <Notice
            alert={false}
            message="Uma conta Google ou Apple com outro e-mail não entra. O link vale uma vez; se expirar, peça um novo à produção."
          />
        </View>
      }
    >
      {demoBuild ? (
        <Notice message="Este é um preview do app, sem backend: aqui não dá para aceitar um convite. Use o modo demo no login." />
      ) : withClerk ? (
        <ClerkActivation link={link} />
      ) : (
        <Notice message="Para aceitar um convite, ponha EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no .env e reinicie o Expo." />
      )}
    </AuthLayout>
  )
}

/** The card's activation, which needs `<ClerkProvider>`. */
function ClerkActivation({ link }: { link: ActivationLink }) {
  const router = useRouter()
  const { invitation, activate, sso } = useActivation(link)
  const [password, setPassword] = useState('')
  const email = invitation.data?.email ?? null

  if (invitation.isError) {
    return (
      <>
        <Notice message={activationErrorMessage(invitation.error, null)} />
        <Button label="Ir para o login" onPress={() => router.replace('/login')} />
      </>
    )
  }

  const busy = invitation.isPending || activate.isPending || sso.isPending
  const error = activate.error ?? sso.error
  const alreadyDone = error instanceof SignInError && error.code === 'activation_already_done'
  const submit = () => {
    if (!password || busy) return
    sso.reset()
    activate.mutate(password)
  }
  const withProvider = (provider: SsoProvider) => {
    activate.reset()
    sso.mutate(provider)
  }

  return (
    <>
      {error ? <Notice message={activationErrorMessage(error, email)} /> : null}
      <Invitee name={link.name} email={email} />
      <TextField
        label="Crie uma senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        onSubmitEditing={submit}
        editable={!invitation.isPending}
      />
      <HintText>Pelo menos 8 caracteres.</HintText>
      <Button
        label="Ativar e entrar"
        onPress={submit}
        loading={activate.isPending}
        disabled={busy || !password}
      />
      <SocialButtons
        divider="ou com o mesmo e-mail"
        onPress={withProvider}
        pending={sso.isPending ? sso.variables : null}
        disabled={busy}
      />
      {alreadyDone ? (
        <Button label="Ir para o login" variant="link" onPress={() => router.replace('/login')} />
      ) : null}
    </>
  )
}

/** Who the invitation is for: the name the events-api sent, and the email Clerk read, locked. */
function Invitee({ name, email }: { name: string | null; email: string | null }) {
  const { colors } = useTheme()
  const main = name ?? email

  return (
    <View
      accessible
      accessibilityLabel={
        email ? `Convite para ${name ? `${name}, ` : ''}${email}` : 'Lendo o convite'
      }
      style={[styles.invitee, { backgroundColor: colors.surfaceBrand }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.action }]}>
        <Text style={[styles.avatarLabel, { color: colors.onAction }]}>
          {main ? initials(name ?? main.split('@')[0]) : ''}
        </Text>
      </View>
      {email ? (
        <View style={styles.inviteeText}>
          <Text style={[styles.inviteeName, { color: colors.text }]}>{main}</Text>
          <Text style={[styles.inviteeEmail, { color: colors.textMuted }]}>
            {name ? `${email} · do convite` : 'do convite'}
          </Text>
        </View>
      ) : (
        <View style={styles.inviteeText}>
          <View style={[styles.bar, styles.nameBar, { backgroundColor: colors.border }]} />
          <View style={[styles.bar, styles.emailBar, { backgroundColor: colors.border }]} />
        </View>
      )}
    </View>
  )
}

function HintText({ children }: { children: string }) {
  const { colors } = useTheme()
  return <Text style={[styles.hint, { color: colors.textMuted }]}>{children}</Text>
}

const styles = StyleSheet.create({
  invitee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: fonts.sans700, fontSize: 15 },
  inviteeText: { flex: 1, gap: 2 },
  inviteeName: { fontFamily: fonts.sans600, fontSize: 15 },
  inviteeEmail: { fontFamily: fonts.sans400, fontSize: 13 },
  bar: { height: 12, borderRadius: 6 },
  nameBar: { width: '55%' },
  emailBar: { width: '75%', marginTop: 4 },
  hint: { marginTop: -4, fontFamily: fonts.sans400, fontSize: 13 },
  warning: { marginTop: 16, marginHorizontal: 16 },
})
