import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Notice, TextField } from '@/shared/components/ui'
import { useSession, type User } from '@/shared/session'
import { fonts, spacing, useTheme } from '@/shared/theme'

import { useUpdateProfile } from '../hooks/use-update-profile'
import {
  errorsFromApi,
  profileChanges,
  profileForm,
  type ProfileErrors,
  type ProfileForm,
} from '../profile-form'

/**
 * "Editar perfil" (D-EditarPerfil, PROJ-214): the name and the phone with its country code, checked
 * before sending and again by the API; the email is the login's and only shown. "Salvar" sends what
 * changed and goes back to the Perfil, which shows it at once.
 */
export function EditProfileScreen() {
  const user = useSession((state) => state.session?.user)
  if (!user) return null
  return <EditProfile user={user} />
}

function EditProfile({ user }: { user: User }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const update = useUpdateProfile()
  const [form, setForm] = useState<ProfileForm>(() => profileForm(user))
  const [errors, setErrors] = useState<ProfileErrors>({})

  const edit = (field: keyof ProfileForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
  }

  const save = () => {
    const checked = profileChanges(form, user)
    setErrors(checked.errors)
    if (checked.errors.name || checked.errors.phone) return
    if (!checked.changes) return router.back()
    const sent = checked.changes
    update.mutate(sent, {
      onSuccess: () => router.back(),
      onError: (error) => setErrors(errorsFromApi(error, sent)),
    })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.bar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            style={styles.cancel}
          >
            <Text style={[styles.cancelLabel, { color: colors.textMuted }]}>Cancelar</Text>
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            Editar perfil
          </Text>
          <View style={styles.cancel} />
        </View>

        <View style={styles.fields}>
          <TextField
            label="Nome"
            value={form.name}
            onChangeText={edit('name')}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
          />
          <TextField
            label="Telefone com DDI"
            value={form.phone}
            onChangeText={edit('phone')}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <View style={[styles.email, { backgroundColor: colors.divider }]}>
            <Text style={[styles.emailLabel, { color: colors.textMuted }]}>E-mail</Text>
            <Text style={[styles.emailValue, { color: colors.textMuted }]}>{user.email}</Text>
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            O e-mail vem do seu login e não muda aqui. O telefone só serve para as pessoas do Group
            falarem com você.
          </Text>
          {errors.form && <Notice message={errors.form} />}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label="Salvar" loading={update.isPending} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, gap: 18, paddingBottom: 24 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancel: { minWidth: 72, height: spacing.touchTarget, justifyContent: 'center' },
  cancelLabel: { fontFamily: fonts.sans400, fontSize: 15 },
  title: { fontFamily: fonts.sans600, fontSize: 16 },
  fields: { gap: 12 },
  email: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  emailLabel: { fontFamily: fonts.sans600, fontSize: 12 },
  emailValue: { fontFamily: fonts.sans400, fontSize: 17 },
  hint: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
})
