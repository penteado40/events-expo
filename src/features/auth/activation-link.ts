/** Search params as expo-router hands them over. */
type Params = Record<string, string | string[] | undefined>

/**
 * The Activation link once accepted (events-api ADR-0020): a Clerk invitation whose redirect is
 * the app's `/activate`. Clerk appends `__clerk_ticket` and `__clerk_status`; `inviter`, `group`
 * and `name` are the events-api's, only for showing. Who signs up is the ticket's alone.
 */
export type ActivationLink = {
  ticket: string | null
  /** Clerk already has the account (`__clerk_status=sign_in`): the link was used before. */
  alreadyActive: boolean
  inviter: string | null
  group: string | null
  name: string | null
}

function param(params: Params, key: string): string | null {
  const raw = params[key]
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim()
  return value ? value : null
}

export function readActivationLink(params: Params): ActivationLink {
  return {
    ticket: param(params, '__clerk_ticket'),
    alreadyActive: param(params, '__clerk_status') === 'sign_in',
    inviter: param(params, 'inviter'),
    group: param(params, 'group'),
    name: param(params, 'name'),
  }
}

/** D-Ativar's title: "Bruno te convidou para o Vocal Livre", with what the link has. */
export function activationTitle({ inviter, group }: Pick<ActivationLink, 'inviter' | 'group'>) {
  const firstName = inviter?.split(/\s+/)[0]
  if (firstName && group) return `${firstName} te convidou para o ${group}`
  if (group) return `Seu convite para o ${group}`
  if (firstName) return `${firstName} te convidou`
  return 'Ative sua conta'
}
