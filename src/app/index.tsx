import { Redirect } from 'expo-router'

import { useSession } from '@/shared/session'

/** Entry route: into the tabs with a Session, otherwise to Login. */
export default function Index() {
  const signedIn = useSession((state) => state.session !== null)
  return <Redirect href={signedIn ? '/events' : '/login'} />
}
