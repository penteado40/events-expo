/** A User as the mock stores it: the API's local User, with the Deactivated user mark. */
export type UserRow = {
  id: number
  name: string
  email: string
  phone: string
  isSuperAdmin: boolean
  /** Set for a Deactivated user (events-api PROJ-166): refused on every request. */
  deactivatedAt: string | null
}

export type GroupRow = { id: number; name: string }

export type GroupMemberRow = { groupId: number; userId: number; role: 'OWNER' | 'VIEWER' }

export const SUPER_ADMIN_ID = 1
/** Bruno Reis, the production of Vocal Livre. */
export const DEMO_OWNER_ID = 2
/** Lu Andrade, a singer. */
export const DEMO_VIEWER_ID = 5

/** The Manaus scenario (PROJ-210): Group Vocal Livre, its production and singers, and the platform admin. */
export function createDataset() {
  const users: UserRow[] = [
    user(SUPER_ADMIN_ID, 'Admin Local', 'admin@local.test', '+5527999990001', {
      isSuperAdmin: true,
    }),
    user(DEMO_OWNER_ID, 'Bruno Reis', 'bruno.reis@example.com', '+5527999990002'),
    user(3, 'Matias Costa', 'matias.costa@example.com', '+5527999990003'),
    user(4, 'Jacque Moreira', 'jacque.moreira@example.com', '+5527999990004'),
    user(DEMO_VIEWER_ID, 'Lu Andrade', 'lu.andrade@example.com', '+5527999990005'),
    user(6, 'Carla Dias', 'carla.dias@example.com', '+5527999990006', {
      deactivatedAt: '2026-10-01T12:00:00.000Z',
    }),
  ]
  const groups: GroupRow[] = [{ id: 1, name: 'Vocal Livre' }]
  const groupMembers: GroupMemberRow[] = [
    { groupId: 1, userId: DEMO_OWNER_ID, role: 'OWNER' },
    { groupId: 1, userId: 3, role: 'VIEWER' },
    { groupId: 1, userId: 4, role: 'VIEWER' },
    { groupId: 1, userId: DEMO_VIEWER_ID, role: 'VIEWER' },
  ]
  return { users, groups, groupMembers }
}

export type Dataset = ReturnType<typeof createDataset>

function user(
  id: number,
  name: string,
  email: string,
  phone: string,
  extra: Partial<Pick<UserRow, 'isSuperAdmin' | 'deactivatedAt'>> = {},
): UserRow {
  return { id, name, email, phone, isSuperAdmin: false, deactivatedAt: null, ...extra }
}
