import { SignOutButton } from '@/features/auth'
import { EmptyScreen } from '@/shared/components/ui'

// The Perfil itself is PROJ-214; until then it only offers "Sair".
export default function ProfileScreen() {
  return (
    <EmptyScreen title="Perfil">
      <SignOutButton />
    </EmptyScreen>
  )
}
