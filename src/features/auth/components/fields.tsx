import { TextField } from '@/shared/components/ui'

type Props = { value: string; onChangeText: (text: string) => void; onSubmitEditing?: () => void }

/** The account's email, as the keyboard and password managers expect it. */
export function EmailField(props: Props) {
  return (
    <TextField
      {...props}
      label="E-mail"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="emailAddress"
      autoComplete="email"
    />
  )
}

/** The code Clerk emailed, which iOS offers to fill in from Mail. */
export function CodeField(props: Props) {
  return (
    <TextField
      {...props}
      label="Código"
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
    />
  )
}
