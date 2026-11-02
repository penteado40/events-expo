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

/** An Event as the mock stores it: where, when (local dates, ADR-0016), state and Participants. */
export type EventRow = {
  id: number
  groupId: number
  name: string
  /** Free text: a city or a venue. */
  place: string
  startDate: string
  endDate: string
  timezone: string
  status: 'DRAFT' | 'PUBLISHED'
  cancelled: boolean
  participantIds: number[]
}

export const SUPER_ADMIN_ID = 1
/** Bruno Reis, the production of Vocal Livre. */
export const DEMO_OWNER_ID = 2
/** Lu Andrade, a singer of Vocal Livre and of Coral Jovem Vitória. */
export const DEMO_VIEWER_ID = 5

const VOCAL_LIVRE = 1
const CORAL_JOVEM = 2

/**
 * The Manaus scenario (PROJ-210): Group Vocal Livre, its production and singers, its Events around
 * the trip to Manaus (20–22 Nov 2026), a second Group, and the platform admin.
 */
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
    // Invited to the platform, but no Owner has added her to a Group yet.
    user(7, 'Rita Souza', 'rita.souza@example.com', '+5527999990007'),
    user(8, 'Ana Prado', 'ana.prado@example.com', '+5527999990008'),
  ]
  const groups: GroupRow[] = [
    { id: VOCAL_LIVRE, name: 'Vocal Livre' },
    { id: CORAL_JOVEM, name: 'Coral Jovem Vitória' },
  ]
  const groupMembers: GroupMemberRow[] = [
    { groupId: VOCAL_LIVRE, userId: DEMO_OWNER_ID, role: 'OWNER' },
    { groupId: VOCAL_LIVRE, userId: 3, role: 'VIEWER' },
    { groupId: VOCAL_LIVRE, userId: 4, role: 'VIEWER' },
    { groupId: VOCAL_LIVRE, userId: DEMO_VIEWER_ID, role: 'VIEWER' },
    { groupId: CORAL_JOVEM, userId: 8, role: 'OWNER' },
    { groupId: CORAL_JOVEM, userId: DEMO_VIEWER_ID, role: 'VIEWER' },
  ]
  const everyone = [DEMO_OWNER_ID, 3, 4, DEMO_VIEWER_ID]
  const saoPaulo = 'America/Sao_Paulo'
  // Ids pick the automatic tone (coral, green, purple, pink, turquoise, gold, …).
  const events: EventRow[] = [
    event(1, VOCAL_LIVRE, 'Gravação do clipe', 'Vitória, ES', ['2026-10-10', '2026-10-10'], {
      participantIds: everyone,
    }),
    event(2, VOCAL_LIVRE, 'Turnê Minas', 'Belo Horizonte, MG', ['2027-03-12', '2027-03-14'], {
      status: 'DRAFT',
    }),
    event(3, VOCAL_LIVRE, 'Saída Manaus', 'Manaus, AM', ['2026-11-20', '2026-11-22'], {
      timezone: 'America/Manaus',
      participantIds: everyone,
    }),
    event(4, VOCAL_LIVRE, 'Ensaio da Banda', 'Estúdio', ['2026-11-08', '2026-11-08'], {
      participantIds: [3],
    }),
    event(5, VOCAL_LIVRE, 'Festival de Verão', 'Vila Velha, ES', ['2026-11-28', '2026-11-28'], {
      cancelled: true,
      participantIds: everyone,
    }),
    event(6, VOCAL_LIVRE, 'Ensaio geral', 'Sede', ['2026-11-05', '2026-11-05'], {
      participantIds: everyone,
    }),
    event(7, CORAL_JOVEM, 'Ensaio aberto', 'Vitória, ES', ['2026-11-14', '2026-11-14'], {
      participantIds: [8, DEMO_VIEWER_ID],
    }),
  ]
  return { users, groups, groupMembers, events }

  function event(
    id: number,
    groupId: number,
    name: string,
    place: string,
    [startDate, endDate]: [string, string],
    extra: Partial<Pick<EventRow, 'timezone' | 'status' | 'cancelled' | 'participantIds'>> = {},
  ): EventRow {
    return {
      id,
      groupId,
      name,
      place,
      startDate,
      endDate,
      timezone: saoPaulo,
      status: 'PUBLISHED',
      cancelled: false,
      participantIds: [],
      ...extra,
    }
  }
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
