import { Button } from '@/shared/components/ui'

import { useSignOut } from '../hooks/use-sign-out'

/** "Sair": ends the Session in the app and in Clerk, back to the login. */
export function SignOutButton() {
  const signOut = useSignOut()
  return <Button label="Sair" variant="secondary" onPress={signOut} />
}
