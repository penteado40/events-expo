import { platformRoleLabel } from '@/shared/domain/roles'
import type { User } from '@/shared/session'

export type AccountRow = { label: string; value: string }

const joinedDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

/** The Perfil card: what a member reads about their account, never the raw `/me` fields. */
export function accountRows(user: User): AccountRow[] {
  const role = platformRoleLabel(user.role)
  return [
    { label: 'Email', value: user.email },
    // A User's roles (Owner, Manager, Viewer) belong to each Event, not to the account.
    ...(role ? [{ label: 'Papel', value: role }] : []),
    { label: 'Membro desde', value: joinedDate(user.createdAt) },
  ]
}
