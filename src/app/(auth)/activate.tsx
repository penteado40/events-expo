import { useLocalSearchParams } from 'expo-router'

import { ActivationScreen, readActivationLink } from '@/features/auth'

/**
 * Where an accepted Activation link lands: `events-expo://activate?…`, the redirect of the Clerk
 * invitation the events-api creates (its ACTIVATION_REDIRECT_URL), with Clerk's ticket appended.
 */
export default function ActivateRoute() {
  return <ActivationScreen link={readActivationLink(useLocalSearchParams())} />
}
